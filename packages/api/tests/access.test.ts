import { describe, expect, test } from "bun:test"
import { call } from "@orpc/server"

import { appRouter } from "#router"
import {
  anonymousContext,
  apiKeyContext,
  sessionContext,
} from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"

const { v0 } = appRouter

describe("protectedProcedure", () => {
  test("rejects an anonymous request with 401", async () => {
    await expectErrorCode(
      call(v0.history.list, undefined, { context: anonymousContext() }),
      "UNAUTHORIZED"
    )
  })

  test("accepts an API key", async () => {
    const result = await call(v0.history.list, undefined, {
      context: apiKeyContext(),
    })
    expect(result.success).toBe(true)
  })
})

describe("sessionProcedure", () => {
  const sessionOnly = [
    [
      "credentials.list",
      () => call(v0.credentials.list, undefined, { context: apiKeyContext() }),
    ],
    [
      "credentials.ntfy.get",
      () =>
        call(v0.credentials.ntfy.get, undefined, { context: apiKeyContext() }),
    ],
    [
      "apiKey.list",
      () => call(v0.apiKey.list, undefined, { context: apiKeyContext() }),
    ],
  ] as const

  for (const [name, run] of sessionOnly) {
    test(`${name} rejects an API key with 403`, async () => {
      await expectErrorCode(run(), "FORBIDDEN")
    })
  }

  test("rejects an anonymous request with 401 before checking the session", async () => {
    await expectErrorCode(
      call(v0.credentials.list, undefined, { context: anonymousContext() }),
      "UNAUTHORIZED"
    )
  })

  test("accepts a signed-in session", async () => {
    const result = await call(v0.credentials.list, undefined, {
      context: sessionContext(),
    })
    expect(result).toEqual({ success: true, credentials: [] })
  })
})
