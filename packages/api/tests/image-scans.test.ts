import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { db } from "@komodo-cd/db"
import { imageScanTable } from "@komodo-cd/db/schema"
import { eq } from "drizzle-orm"

import { collectImages, ImageScanQueue } from "#lib/image-scans"
import { komodoService } from "#lib/komodo"
import { TrivyScanError, trivyService } from "#lib/trivy"
import { komodoStack } from "#tests/fixtures/stacks"
import { trivyReportJson } from "#tests/fixtures/trivy"

const row = async (image: string) => {
  const [found] = await db
    .select()
    .from(imageScanTable)
    .where(eq(imageScanTable.image, image))
  return found
}

describe("collectImages", () => {
  test("groups the stacks of each image and skips templates and empty images", () => {
    const images = collectImages([
      komodoStack("worker", ["app:2", ""]),
      komodoStack("web", ["app:2", "nginx:1.27"]),
      komodoStack("tpl", ["redis:7"], { template: true }),
    ])
    expect([...images]).toEqual([
      ["app:2", ["web", "worker"]],
      ["nginx:1.27", ["web"]],
    ])
  })
})

describe("ImageScanQueue", () => {
  let queue: ImageScanQueue
  let enabled: ReturnType<typeof spyOn>
  let run: ReturnType<typeof spyOn>

  beforeEach(async () => {
    await db.delete(imageScanTable)
    queue = new ImageScanQueue()
    enabled = spyOn(trivyService, "isEnabled").mockReturnValue(true)
    run = spyOn(trivyService, "run").mockResolvedValue(trivyReportJson)
  })

  afterEach(async () => {
    queue.close()
    await queue.idle()
    enabled.mockRestore()
    run.mockRestore()
  })

  test("a successful scan stores the parsed result", async () => {
    expect(await queue.enqueue(["alpine:3.19"])).toEqual(["alpine:3.19"])
    await queue.idle()

    const scan = await row("alpine:3.19")
    expect(scan).toMatchObject({
      status: "done",
      os: "alpine 3.19.9",
      critical: 1,
      high: 1,
      fixable: 4,
      error: null,
    })
    expect(scan?.vulnerabilities).toHaveLength(5)
    expect(scan?.scannedAt).toBeInstanceOf(Date)
    expect(scan?.requestedAt).toBeInstanceOf(Date)
  })

  test("a failed rescan keeps the previous result and records why", async () => {
    await queue.enqueue(["alpine:3.19"])
    await queue.idle()
    const before = await row("alpine:3.19")

    run.mockRejectedValue(new TrivyScanError("unauthorized", "DENIED"))
    await queue.enqueue(["alpine:3.19"])
    await queue.idle()

    const after = await row("alpine:3.19")
    expect(after).toMatchObject({
      status: "failed",
      error: "DENIED",
      errorKind: "unauthorized",
      critical: 1,
    })
    expect(after?.vulnerabilities).toHaveLength(5)
    expect(after?.scannedAt).toEqual(before?.scannedAt as Date)
    expect(after?.attemptedAt).toBeInstanceOf(Date)
  })

  test("an unreadable report fails as other", async () => {
    run.mockResolvedValue("not json")
    await queue.enqueue(["broken:1"])
    await queue.idle()
    expect(await row("broken:1")).toMatchObject({
      status: "failed",
      errorKind: "other",
    })
  })

  test("an image already queued or running is not queued again", async () => {
    let finish = () => {}
    run.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          finish = () => resolve(trivyReportJson)
        })
    )
    expect(await queue.enqueue(["alpine:3.19"])).toEqual(["alpine:3.19"])
    expect(await queue.enqueue(["alpine:3.19", "alpine:3.19"])).toEqual([])
    expect((await row("alpine:3.19"))?.status).toBe("scanning")

    finish()
    await queue.idle()
    expect(run).toHaveBeenCalledTimes(1)
  })

  test("enqueueMissing picks never-scanned and orphaned images only", async () => {
    await db.insert(imageScanTable).values([
      { image: "done:1", status: "done" },
      { image: "orphan:1", status: "scanning" },
    ])
    const queued = await queue.enqueueMissing(["done:1", "orphan:1", "new:1"])
    expect(queued.sort()).toEqual(["new:1", "orphan:1"])
    await queue.idle()
  })

  test("nothing is queued while Trivy is disabled", async () => {
    enabled.mockReturnValue(false)
    expect(await queue.enqueue(["alpine:3.19"])).toEqual([])
    expect(await queue.enqueueMissing(["alpine:3.19"])).toEqual([])
    expect(await row("alpine:3.19")).toBeUndefined()
    expect(run).not.toHaveBeenCalled()
  })

  test("enqueueStack queues the images of that stack", async () => {
    const list = spyOn(komodoService, "listAllStacks").mockResolvedValue([
      komodoStack("web", ["nginx:1.27", "app:2"]),
      komodoStack("db", ["postgres:17"]),
    ])
    await queue.enqueueStack("web")
    await queue.idle()
    const scanned = run.mock.calls.map((call: unknown[]) => call[0]).sort()
    expect(scanned).toEqual(["app:2", "nginx:1.27"])
    list.mockRestore()
  })

  test("enqueueStack never throws when Komodo fails", async () => {
    const list = spyOn(komodoService, "listAllStacks").mockRejectedValue(
      new Error("boom")
    )
    await expect(queue.enqueueStack("web")).resolves.toBeUndefined()
    list.mockRestore()
  })

  test("close stops running scans and leaves their row to be picked up", async () => {
    run.mockImplementation(
      (_image: string, { signal }: { signal?: AbortSignal } = {}) =>
        new Promise<string>((_resolve, reject) => {
          if (signal?.aborted)
            reject(new TrivyScanError("other", "Escaneo cancelado"))
          signal?.addEventListener("abort", () =>
            reject(new TrivyScanError("other", "Escaneo cancelado"))
          )
        })
    )
    await queue.enqueue(["slow:1"])
    queue.close()
    await queue.idle()

    expect((await row("slow:1"))?.status).toBe("scanning")
    expect(queue.isTracked("slow:1")).toBe(false)
  })
})
