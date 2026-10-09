import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { call } from "@orpc/server"

import { deployEvents } from "#lib/deploy-events"
import { imageScans } from "#lib/image-scans"
import { komodoService } from "#lib/komodo"
import { ntfyService } from "#lib/ntfy"
import { appRouter } from "#router"
import { apiKeyContext } from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"

const trigger = (action: "pull" | "redeploy" | "pull-redeploy") =>
  call(
    appRouter.v0.deploy.trigger,
    { stack: "web", action },
    { context: apiKeyContext() }
  )

// komodo_client no lanza Error sino { status, result: { error } }
const komodoFailure = { status: 404, result: { error: "stack not found" } }

describe("deploy.trigger", () => {
  let pull: ReturnType<typeof spyOn>
  let redeploy: ReturnType<typeof spyOn>
  let notify: ReturnType<typeof spyOn>

  beforeEach(async () => {
    await db.delete(actionHistoryTable)
    pull = spyOn(komodoService, "pullImage").mockResolvedValue(
      undefined as never
    )
    redeploy = spyOn(komodoService, "redeploy").mockResolvedValue(
      undefined as never
    )
    notify = spyOn(ntfyService, "notifyDeployFailure").mockResolvedValue(
      undefined
    )
  })

  afterEach(() => {
    pull.mockRestore()
    redeploy.mockRestore()
    notify.mockRestore()
  })

  test("pull-redeploy pulls, then redeploys and records a success", async () => {
    const result = await trigger("pull-redeploy")

    expect(result).toMatchObject({
      success: true,
      stack: "web",
      action: "pull-redeploy",
    })
    expect(pull).toHaveBeenCalledWith("web")
    expect(redeploy).toHaveBeenCalledWith("web")

    const history = await db.select().from(actionHistoryTable)
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({
      stack: "web",
      success: true,
      userName: "API Key: ci",
    })
    expect(notify).not.toHaveBeenCalled()
  })

  test("pull only pulls", async () => {
    await trigger("pull")
    expect(pull).toHaveBeenCalledTimes(1)
    expect(redeploy).not.toHaveBeenCalled()
  })

  test("a Komodo failure answers 502 with its message, records it and alerts", async () => {
    redeploy.mockRejectedValue(komodoFailure)

    const err = await expectErrorCode(trigger("redeploy"), "BAD_GATEWAY")
    expect(err.status).toBe(502)
    expect(err.message).toBe("stack not found")

    const [row] = await db.select().from(actionHistoryTable)
    expect(row).toMatchObject({ success: false, message: "stack not found" })
    expect(notify).toHaveBeenCalledTimes(1)
  })

  test("without a Komodo connection it answers 503", async () => {
    pull.mockRestore()
    // Sin credenciales en la base de datos, initialize() deja el cliente a null
    await komodoService.initialize()

    const err = await expectErrorCode(trigger("pull"), "SERVICE_UNAVAILABLE")
    expect(err.status).toBe(503)
  })
})

describe("deploy.trigger events", () => {
  let pull: ReturnType<typeof spyOn>
  let redeploy: ReturnType<typeof spyOn>
  let notify: ReturnType<typeof spyOn>
  let controller: AbortController

  beforeEach(async () => {
    await db.delete(actionHistoryTable)
    controller = new AbortController()
    pull = spyOn(komodoService, "pullImage").mockResolvedValue(
      undefined as never
    )
    redeploy = spyOn(komodoService, "redeploy").mockResolvedValue(
      undefined as never
    )
    notify = spyOn(ntfyService, "notifyDeployFailure").mockResolvedValue(
      undefined
    )
  })

  afterEach(() => {
    controller.abort()
    pull.mockRestore()
    redeploy.mockRestore()
    notify.mockRestore()
  })

  test("an API key deploy publishes started and finished for the same run", async () => {
    const events = deployEvents.subscribe(controller.signal)

    const result = await trigger("redeploy")

    const started = (await events.next()).value
    expect(started).toMatchObject({
      type: "started",
      run: { stack: "web", action: "redeploy", via: "apiKey", actorName: "ci" },
    })
    const finished = (await events.next()).value
    expect(finished).toMatchObject({
      type: "finished",
      success: true,
      message: result.message,
    })
    if (started?.type !== "started" || finished?.type !== "finished") {
      throw new Error("unexpected events")
    }
    expect(finished.run.id).toBe(started.run.id)
    expect(deployEvents.running()).toHaveLength(0)
    // La respuesta de trigger no cambia
    expect(Object.keys(result).sort()).toEqual([
      "action",
      "message",
      "stack",
      "success",
    ])
  })

  test("a failure finishes with its message, after the history row and before ntfy", async () => {
    redeploy.mockRejectedValue(komodoFailure)
    // ntfy no responde hasta que el test lo suelta
    let releaseNtfy = () => {}
    notify.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseNtfy = resolve
        })
    )
    const events = deployEvents.subscribe(controller.signal)

    const pending = expectErrorCode(trigger("redeploy"), "BAD_GATEWAY")

    expect((await events.next()).value).toMatchObject({ type: "started" })
    expect((await events.next()).value).toMatchObject({
      type: "finished",
      success: false,
      message: "stack not found",
    })
    expect(deployEvents.running()).toHaveLength(0)
    const rows = await db.select().from(actionHistoryTable)
    expect(rows).toHaveLength(1)
    expect(notify).toHaveBeenCalledTimes(1)

    releaseNtfy()
    await pending
  })
})

describe("deploy.trigger image scans", () => {
  let pull: ReturnType<typeof spyOn>
  let redeploy: ReturnType<typeof spyOn>
  let notify: ReturnType<typeof spyOn>
  let enqueueStack: ReturnType<typeof spyOn>

  beforeEach(async () => {
    await db.delete(actionHistoryTable)
    pull = spyOn(komodoService, "pullImage").mockResolvedValue(
      undefined as never
    )
    redeploy = spyOn(komodoService, "redeploy").mockResolvedValue(
      undefined as never
    )
    notify = spyOn(ntfyService, "notifyDeployFailure").mockResolvedValue(
      undefined
    )
    enqueueStack = spyOn(imageScans, "enqueueStack").mockResolvedValue(
      undefined
    )
  })

  afterEach(() => {
    pull.mockRestore()
    redeploy.mockRestore()
    notify.mockRestore()
    enqueueStack.mockRestore()
  })

  test("a successful deploy queues the stack's images", async () => {
    const result = await trigger("pull-redeploy")
    expect(result.success).toBe(true)
    expect(enqueueStack).toHaveBeenCalledWith("web")
  })

  test("a failed deploy queues nothing", async () => {
    pull.mockRejectedValue(komodoFailure)
    await expectErrorCode(trigger("pull"), "BAD_GATEWAY")
    expect(enqueueStack).not.toHaveBeenCalled()
  })

  test("a failing enqueue does not change the response", async () => {
    enqueueStack.mockRejectedValue(new Error("boom"))
    const result = await trigger("redeploy")
    expect(result).toMatchObject({ success: true, action: "redeploy" })
  })
})
