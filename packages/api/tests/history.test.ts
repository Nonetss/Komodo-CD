import { beforeEach, describe, expect, test } from "bun:test"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { call } from "@orpc/server"

import { appRouter } from "#router"
import { sessionContext } from "#tests/fixtures/context"

type Row = typeof actionHistoryTable.$inferInsert

const row = (overrides: Partial<Row> = {}): Row => ({
  userId: "user-1",
  stack: "web",
  action: "pull",
  success: true,
  ...overrides,
})

const list = () =>
  call(appRouter.v0.history.list, undefined, { context: sessionContext() })

/** Inserta una fila y devuelve su entrada en `history.list`. */
const entryFor = async (overrides: Partial<Row>) => {
  await db.insert(actionHistoryTable).values(row(overrides))
  const { history } = await list()
  return history[0]
}

describe("history.list", () => {
  beforeEach(async () => {
    await db.delete(actionHistoryTable)
  })

  test("a named API key is an apiKey actor with the key name", async () => {
    expect(
      await entryFor({ userName: "API Key: github", userEmail: "" })
    ).toMatchObject({ via: "apiKey", actorName: "github" })
  })

  test("an unnamed API key is an apiKey actor without name", async () => {
    expect(
      await entryFor({ userName: "API Key", userEmail: "" })
    ).toMatchObject({ via: "apiKey", actorName: null })
  })

  test("a signed-in user is a session actor with their name", async () => {
    expect(
      await entryFor({ userName: "Ana", userEmail: "ana@example.com" })
    ).toMatchObject({ via: "session", actorName: "Ana" })
  })

  test("a session actor without name falls back to the email", async () => {
    expect(
      await entryFor({ userName: null, userEmail: "ana@example.com" })
    ).toMatchObject({ via: "session", actorName: "ana@example.com" })
  })

  test("a session actor without name or email falls back to the user id", async () => {
    expect(
      await entryFor({ userId: "user-9", userName: null, userEmail: null })
    ).toMatchObject({ via: "session", actorName: "user-9" })
  })

  test("a user whose name looks like a key stays a session actor", async () => {
    expect(
      await entryFor({ userName: "API Keyes", userEmail: "keyes@example.com" })
    ).toMatchObject({ via: "session", actorName: "API Keyes" })
    await db.delete(actionHistoryTable)
    expect(
      await entryFor({ userName: "API Key: x", userEmail: "x@example.com" })
    ).toMatchObject({ via: "session", actorName: "API Key: x" })
  })

  test("returns the 100 newest rows, newest first", async () => {
    const start = Date.parse("2026-01-01T00:00:00Z")
    await db
      .insert(actionHistoryTable)
      .values(
        Array.from({ length: 150 }, (_, i) =>
          row({ stack: `stack-${i}`, createdAt: new Date(start + i * 1000) })
        )
      )

    const { history } = await list()

    expect(history).toHaveLength(100)
    expect(history[0]?.stack).toBe("stack-149")
    expect(history[99]?.stack).toBe("stack-50")
  })
})
