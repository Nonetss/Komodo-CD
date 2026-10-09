import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { call } from "@orpc/server"
import type { Types } from "komodo_client"

import { failedUpdateError, komodoService } from "#lib/komodo"
import { appRouter } from "#router"
import { apiKeyContext } from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"

const update = (
  success: boolean,
  logs: Partial<Types.Log>[] = []
): Types.Update =>
  ({
    success,
    status: "Complete",
    logs: logs.map((log) => ({
      stage: "",
      command: "",
      stdout: "",
      stderr: "",
      success: true,
      start_ts: 0,
      end_ts: 0,
      ...log,
    })),
  }) as unknown as Types.Update

const failedPull = update(false, [
  { stage: "Validate", success: true },
  { stage: "Pull Stack", success: false, stderr: "manifest unknown\n" },
])

// El cliente es privado: los tests le ponen uno falso y lo devuelven después
const service = komodoService as unknown as { client: unknown }

describe("komodoService pull and redeploy", () => {
  let executeAndPoll: ReturnType<typeof mock>
  let previous: unknown

  beforeEach(async () => {
    await db.delete(actionHistoryTable)
    executeAndPoll = mock(async () => update(true))
    previous = service.client
    service.client = { execute_and_poll: executeAndPoll }
  })

  afterEach(() => {
    service.client = previous
  })

  test("waits for Komodo to finish the task", async () => {
    const result = await komodoService.pullImage("web")

    expect(executeAndPoll).toHaveBeenCalledWith("PullStack", { stack: "web" })
    expect(result.success).toBe(true)
  })

  test("a task that ends badly throws with the failed step's output", async () => {
    executeAndPoll.mockResolvedValue(failedPull)

    await expect(komodoService.redeploy("web")).rejects.toThrow(
      "Pull Stack: manifest unknown"
    )
  })

  test("pull-redeploy does not redeploy when the pull fails, and answers 502", async () => {
    executeAndPoll.mockResolvedValue(failedPull)

    const err = await expectErrorCode(
      call(
        appRouter.v0.deploy.trigger,
        { stack: "web", action: "pull-redeploy" },
        { context: apiKeyContext() }
      ),
      "BAD_GATEWAY"
    )
    expect(err.message).toBe("Pull Stack: manifest unknown")
    expect(executeAndPoll).toHaveBeenCalledTimes(1)

    const [row] = await db.select().from(actionHistoryTable)
    expect(row).toMatchObject({ success: false })
  })
})

describe("failedUpdateError", () => {
  test("falls back to stdout, then to a generic text", () => {
    expect(
      failedUpdateError(
        update(false, [{ stage: "Deploy", success: false, stdout: "boom" }])
      ).message
    ).toBe("Deploy: boom")
    expect(failedUpdateError(update(false)).message).toBe("sin detalles")
  })
})
