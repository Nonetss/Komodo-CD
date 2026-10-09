import { describe, expect, test } from "bun:test"
import { call } from "@orpc/server"

import { appRouter } from "#router"
import { sessionContext } from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"

const { credentials } = appRouter.v0

describe("credentials", () => {
  test("never returns the key or the secret", async () => {
    await call(
      credentials.save,
      {
        name: "main",
        url: "https://komodo.example.com",
        key: "k",
        secret: "s",
      },
      { context: sessionContext() }
    )

    const result = await call(credentials.list, undefined, {
      context: sessionContext(),
    })
    expect(result.credentials).toEqual([
      expect.objectContaining({
        name: "main",
        url: "https://komodo.example.com",
      }),
    ])
    expect(JSON.stringify(result)).not.toContain('"secret"')
    expect(Object.keys(result.credentials[0] ?? {})).not.toContain("key")

    await call(
      credentials.remove,
      { name: "main" },
      { context: sessionContext() }
    )
  })

  test("removing unknown credentials answers 404", async () => {
    await expectErrorCode(
      call(
        credentials.remove,
        { name: "missing" },
        { context: sessionContext() }
      ),
      "NOT_FOUND"
    )
  })
})
