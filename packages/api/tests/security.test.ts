import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { db } from "@komodo-cd/db"
import { imageScanTable } from "@komodo-cd/db/schema"
import { call } from "@orpc/server"

import { errors } from "#errors"
import { imageScans } from "#lib/image-scans"
import { komodoService } from "#lib/komodo"
import { trivyService } from "#lib/trivy"
import { appRouter } from "#router"
import { anonymousContext, apiKeyContext } from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"
import { komodoStack } from "#tests/fixtures/stacks"
import { trivyReportJson } from "#tests/fixtures/trivy"

const { security } = appRouter.v0

const stacks = [
  komodoStack("web", ["ghcr.io/acme/app:2.1", "nginx:1.27"]),
  komodoStack("worker", ["ghcr.io/acme/app:2.1", ""]),
  komodoStack("tpl", ["redis:7"], { template: true }),
]

describe("v0.security", () => {
  let list: ReturnType<typeof spyOn>
  let enabled: ReturnType<typeof spyOn>
  let run: ReturnType<typeof spyOn>

  beforeEach(async () => {
    await db.delete(imageScanTable)
    list = spyOn(komodoService, "listAllStacks").mockResolvedValue(stacks)
    enabled = spyOn(trivyService, "isEnabled").mockReturnValue(true)
    run = spyOn(trivyService, "run").mockResolvedValue(trivyReportJson)
  })

  afterEach(async () => {
    await imageScans.idle()
    list.mockRestore()
    enabled.mockRestore()
    run.mockRestore()
  })

  describe("list", () => {
    test("returns each image once with its stacks and queues the missing ones", async () => {
      const result = await call(security.list, undefined, {
        context: apiKeyContext(),
      })
      expect(result.enabled).toBe(true)
      expect(result.images.map((i) => [i.image, i.stacks])).toEqual([
        ["ghcr.io/acme/app:2.1", ["web", "worker"]],
        ["nginx:1.27", ["web"]],
      ])
      // Con dos escaneos a la vez pueden haber empezado ya
      for (const image of result.images) {
        expect(["queued", "scanning"]).toContain(image.status)
      }
      await imageScans.idle()
      expect(run).toHaveBeenCalledTimes(2)
    })

    test("sorts by severity, failed first among equals", async () => {
      await db.insert(imageScanTable).values([
        { image: "ghcr.io/acme/app:2.1", status: "failed" },
        { image: "nginx:1.27", status: "done", high: 3 },
      ])
      const { images } = await call(security.list, undefined, {
        context: apiKeyContext(),
      })
      expect(images.map((i) => i.image)).toEqual([
        "nginx:1.27",
        "ghcr.io/acme/app:2.1",
      ])
      expect(images[0]?.counts.high).toBe(3)
      expect(run).not.toHaveBeenCalled()
    })

    test("without Trivy it lists the images as not scanned and queues nothing", async () => {
      enabled.mockReturnValue(false)
      const result = await call(security.list, undefined, {
        context: apiKeyContext(),
      })
      expect(result.enabled).toBe(false)
      expect(result.images.every((i) => i.status === "none")).toBe(true)
      expect(run).not.toHaveBeenCalled()
    })

    test("passes Komodo errors through", async () => {
      list.mockRejectedValue(errors.SERVICE_UNAVAILABLE())
      await expectErrorCode(
        call(security.list, undefined, { context: apiKeyContext() }),
        "SERVICE_UNAVAILABLE"
      )
      list.mockRejectedValue({ status: 500, result: { error: "boom" } })
      await expectErrorCode(
        call(security.list, undefined, { context: apiKeyContext() }),
        "BAD_GATEWAY"
      )
    })

    test("rejects an anonymous request", async () => {
      await expectErrorCode(
        call(security.list, undefined, { context: anonymousContext() }),
        "UNAUTHORIZED"
      )
    })
  })

  describe("get", () => {
    test("returns the vulnerabilities of a scanned image", async () => {
      await call(
        security.scan,
        { images: ["nginx:1.27"] },
        {
          context: apiKeyContext(),
        }
      )
      await imageScans.idle()

      const detail = await call(
        security.get,
        { image: "nginx:1.27" },
        {
          context: apiKeyContext(),
        }
      )
      expect(detail).toMatchObject({
        image: "nginx:1.27",
        stacks: ["web"],
        status: "done",
        digest: expect.stringMatching(/^alpine@sha256:/),
      })
      expect(detail.vulnerabilities[0]).toMatchObject({
        id: "CVE-2026-1111",
        severity: "CRITICAL",
      })
    })

    test("is NOT_FOUND for an image no stack uses or never scanned", async () => {
      await expectErrorCode(
        call(security.get, { image: "redis:7" }, { context: apiKeyContext() }),
        "NOT_FOUND"
      )
      await expectErrorCode(
        call(
          security.get,
          { image: "nginx:1.27" },
          {
            context: apiKeyContext(),
          }
        ),
        "NOT_FOUND"
      )
    })
  })

  describe("scan", () => {
    test("queues every Komodo image without input", async () => {
      const { queued } = await call(security.scan, undefined, {
        context: apiKeyContext(),
      })
      expect(queued.sort()).toEqual(["ghcr.io/acme/app:2.1", "nginx:1.27"])
    })

    test("queues the given images once", async () => {
      let finish = () => {}
      run.mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            finish = () => resolve(trivyReportJson)
          })
      )
      const first = await call(
        security.scan,
        { images: ["nginx:1.27"] },
        {
          context: apiKeyContext(),
        }
      )
      const second = await call(
        security.scan,
        { images: ["nginx:1.27"] },
        {
          context: apiKeyContext(),
        }
      )
      expect(first.queued).toEqual(["nginx:1.27"])
      expect(second.queued).toEqual([])
      finish()
    })

    test("rejects images no stack uses without queuing any", async () => {
      const err = await expectErrorCode(
        call(
          security.scan,
          { images: ["nginx:1.27", "evil.example.com/x:1"] },
          { context: apiKeyContext() }
        ),
        "BAD_REQUEST"
      )
      expect(err.message).toContain("evil.example.com/x:1")
      expect(run).not.toHaveBeenCalled()
    })

    test("is SERVICE_UNAVAILABLE without Trivy", async () => {
      enabled.mockReturnValue(false)
      await expectErrorCode(
        call(security.scan, undefined, { context: apiKeyContext() }),
        "SERVICE_UNAVAILABLE"
      )
    })
  })
})
