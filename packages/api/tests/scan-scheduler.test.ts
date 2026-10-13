import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { db } from "@komodo-cd/db"
import { imageScanTable } from "@komodo-cd/db/schema"
import { eq } from "drizzle-orm"

import { errors } from "#errors"
import { ImageScanQueue } from "#lib/image-scans"
import { komodoService } from "#lib/komodo"
import { ScanScheduler } from "#lib/scan-scheduler"
import { trivyService } from "#lib/trivy"
import { komodoStack } from "#tests/fixtures/stacks"
import { trivyReportJson } from "#tests/fixtures/trivy"

const HOUR_MS = 3_600_000
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR_MS)

const status = async (image: string) => {
  const [found] = await db
    .select({ status: imageScanTable.status })
    .from(imageScanTable)
    .where(eq(imageScanTable.image, image))
  return found?.status
}

// Filas ya escaneadas hace `h` horas, pedidas justo antes
const scannedRows = (images: string[], h: number) =>
  db.insert(imageScanTable).values(
    images.map((image) => ({
      image,
      status: "done" as const,
      requestedAt: hoursAgo(h),
      attemptedAt: hoursAgo(h),
      scannedAt: hoursAgo(h),
    }))
  )

describe("ScanScheduler", () => {
  let queue: ImageScanQueue
  let enabled: ReturnType<typeof spyOn>
  let run: ReturnType<typeof spyOn>
  let stacks: ReturnType<typeof spyOn>
  let deploys: ReturnType<typeof spyOn>

  // Imágenes que llegaron a Trivy, en orden
  const scanned = () => run.mock.calls.map((call: unknown[]) => call[0])
  const scheduler = (rescanIntervalHours = 24) =>
    new ScanScheduler({ queue, rescanIntervalHours })

  beforeEach(async () => {
    await db.delete(imageScanTable)
    queue = new ImageScanQueue()
    enabled = spyOn(trivyService, "isEnabled").mockReturnValue(true)
    run = spyOn(trivyService, "run").mockResolvedValue(trivyReportJson)
    stacks = spyOn(komodoService, "listAllStacks").mockResolvedValue([
      komodoStack("web", ["nginx:1.27", "app:2"]),
      komodoStack("worker", ["app:2"]),
    ])
    deploys = spyOn(komodoService, "listRecentStackDeploys").mockResolvedValue(
      []
    )
  })

  afterEach(async () => {
    queue.close()
    await queue.idle()
    enabled.mockRestore()
    run.mockRestore()
    stacks.mockRestore()
    deploys.mockRestore()
  })

  test("queues images that were never scanned", async () => {
    await scannedRows(["nginx:1.27"], 1)

    await scheduler().sweep()
    await queue.idle()

    expect(scanned()).toEqual(["app:2"])
  })

  test("a deploy made inside Komodo queues its stack's images", async () => {
    await scannedRows(["nginx:1.27", "app:2"], 2)
    deploys.mockResolvedValue([{ stackId: "id-web", startedAt: hoursAgo(1) }])

    await scheduler().sweep()
    await queue.idle()

    expect(scanned().sort()).toEqual(["app:2", "nginx:1.27"])
  })

  test("a deploy already covered by a later request queues nothing", async () => {
    await scannedRows(["nginx:1.27", "app:2"], 1)
    deploys.mockResolvedValue([{ stackId: "id-web", startedAt: hoursAgo(2) }])

    await scheduler().sweep()

    expect(run).not.toHaveBeenCalled()
  })

  test("an image used by two stacks takes the latest deploy", async () => {
    await scannedRows(["nginx:1.27", "app:2"], 2)
    deploys.mockResolvedValue([
      // web antes del último escaneo; worker después
      { stackId: "id-web", startedAt: hoursAgo(3) },
      { stackId: "id-worker", startedAt: hoursAgo(1) },
    ])

    await scheduler().sweep()
    await queue.idle()

    expect(scanned()).toEqual(["app:2"])
  })

  test("the deploys of a deleted stack are ignored", async () => {
    await scannedRows(["nginx:1.27", "app:2"], 2)
    deploys.mockResolvedValue([{ stackId: "id-gone", startedAt: hoursAgo(1) }])

    await scheduler().sweep()

    expect(run).not.toHaveBeenCalled()
  })

  test("rescans images older than the interval", async () => {
    await scannedRows(["nginx:1.27"], 25)
    await scannedRows(["app:2"], 1)

    await scheduler(24).sweep()
    await queue.idle()

    expect(scanned()).toEqual(["nginx:1.27"])
  })

  test("an interval of 0 skips the periodic rescan but not the deploys", async () => {
    await scannedRows(["nginx:1.27", "app:2"], 24 * 7)
    deploys.mockResolvedValue([
      { stackId: "id-worker", startedAt: hoursAgo(1) },
    ])

    await scheduler(0).sweep()
    await queue.idle()

    expect(scanned()).toEqual(["app:2"])
  })

  test("a failure reading the Updates still runs the periodic rescan", async () => {
    await scannedRows(["nginx:1.27", "app:2"], 25)
    deploys.mockRejectedValue(new Error("ListUpdates failed"))

    await scheduler().sweep()
    await queue.idle()

    expect(run).toHaveBeenCalledTimes(2)
  })

  test("without a Komodo connection nothing is queued and nothing throws", async () => {
    stacks.mockRejectedValue(
      errors.SERVICE_UNAVAILABLE({ message: "Komodo no está configurado" })
    )

    await scheduler().sweep()

    expect(run).not.toHaveBeenCalled()
    expect(await status("app:2")).toBeUndefined()
  })

  test("a Komodo error is logged and the sweep resolves", async () => {
    stacks.mockRejectedValue(new Error("boom"))

    await expect(scheduler().sweep()).resolves.toBeUndefined()
    expect(run).not.toHaveBeenCalled()
  })

  test("start does nothing while Trivy is disabled", () => {
    enabled.mockReturnValue(false)
    const timeout = spyOn(globalThis, "setTimeout")
    const interval = spyOn(globalThis, "setInterval")
    try {
      const s = scheduler()
      s.start()
      expect(timeout).not.toHaveBeenCalled()
      expect(interval).not.toHaveBeenCalled()
      s.stop()
    } finally {
      timeout.mockRestore()
      interval.mockRestore()
    }
  })

  test("start is idempotent and stop clears the timers", () => {
    const interval = spyOn(globalThis, "setInterval")
    const clear = spyOn(globalThis, "clearInterval")
    try {
      const s = scheduler()
      s.start()
      s.start()
      expect(interval).toHaveBeenCalledTimes(1)
      s.stop()
      expect(clear).toHaveBeenCalledTimes(1)
    } finally {
      interval.mockRestore()
      clear.mockRestore()
    }
  })
})
