import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { call } from "@orpc/server"

import { komodoService } from "#lib/komodo"
import { appRouter } from "#router"
import {
  anonymousContext,
  apiKeyContext,
  sessionContext,
} from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"

const remove = (context = sessionContext()) =>
  call(appRouter.v0.stacks.remove, { stack: "web" }, { context })

// komodo_client no lanza Error sino { status, result: { error } }
const komodoFailure = { status: 404, result: { error: "stack not found" } }

describe("stacks.remove", () => {
  let deleteStack: ReturnType<typeof spyOn>

  beforeEach(() => {
    deleteStack = spyOn(komodoService, "deleteStack").mockResolvedValue(
      undefined as never
    )
  })

  afterEach(() => {
    deleteStack.mockRestore()
  })

  test("a signed-in session deletes the stack in Komodo", async () => {
    const result = await remove()

    expect(result).toMatchObject({ success: true, stack: "web" })
    expect(deleteStack).toHaveBeenCalledWith("web")
  })

  test("rejects an API key with 403 without touching Komodo", async () => {
    await expectErrorCode(remove(apiKeyContext()), "FORBIDDEN")
    expect(deleteStack).not.toHaveBeenCalled()
  })

  test("rejects an anonymous request with 401", async () => {
    await expectErrorCode(remove(anonymousContext()), "UNAUTHORIZED")
    expect(deleteStack).not.toHaveBeenCalled()
  })

  test("a Komodo failure answers 502 with its message", async () => {
    deleteStack.mockRejectedValue(komodoFailure)

    const err = await expectErrorCode(remove(), "BAD_GATEWAY")
    expect(err.status).toBe(502)
    expect(err.message).toBe("stack not found")
  })

  test("answers 503 when no Komodo connection is configured", async () => {
    deleteStack.mockRestore()

    const err = await expectErrorCode(remove(), "SERVICE_UNAVAILABLE")
    expect(err.status).toBe(503)
  })
})

const pollForUpdates = (context = sessionContext()) =>
  call(
    appRouter.v0.stacks.pollForUpdates,
    { stack: "web", enabled: true },
    { context }
  )

describe("stacks.pollForUpdates", () => {
  let setPollForUpdates: ReturnType<typeof spyOn>

  beforeEach(() => {
    setPollForUpdates = spyOn(
      komodoService,
      "setPollForUpdates"
    ).mockResolvedValue(undefined as never)
  })

  afterEach(() => {
    setPollForUpdates.mockRestore()
  })

  test("a signed-in session turns on poll for updates in Komodo", async () => {
    const result = await pollForUpdates()

    expect(result).toEqual({ success: true, stack: "web", enabled: true })
    expect(setPollForUpdates).toHaveBeenCalledWith("web", true)
  })

  test("rejects an API key with 403 without touching Komodo", async () => {
    await expectErrorCode(pollForUpdates(apiKeyContext()), "FORBIDDEN")
    expect(setPollForUpdates).not.toHaveBeenCalled()
  })

  test("rejects an anonymous request with 401", async () => {
    await expectErrorCode(pollForUpdates(anonymousContext()), "UNAUTHORIZED")
    expect(setPollForUpdates).not.toHaveBeenCalled()
  })

  test("a Komodo failure answers 502 with its message", async () => {
    setPollForUpdates.mockRejectedValue(komodoFailure)

    const err = await expectErrorCode(pollForUpdates(), "BAD_GATEWAY")
    expect(err.status).toBe(502)
    expect(err.message).toBe("stack not found")
  })

  test("answers 503 when no Komodo connection is configured", async () => {
    setPollForUpdates.mockRestore()

    const err = await expectErrorCode(pollForUpdates(), "SERVICE_UNAVAILABLE")
    expect(err.status).toBe(503)
  })
})
