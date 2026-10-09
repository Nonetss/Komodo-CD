import { describe, expect, test } from "bun:test"
import { call } from "@orpc/server"

import {
  DeployEventBus,
  type DeployRun,
  deployEvents,
} from "#lib/deploy-events"
import { appRouter } from "#router"
import { anonymousContext, apiKeyContext } from "#tests/fixtures/context"
import { expectErrorCode } from "#tests/fixtures/errors"

const run = (id: string, stack = "web"): DeployRun => ({
  id,
  stack,
  action: "redeploy",
  via: "apiKey",
  actorName: "ci",
  startedAt: "2026-01-01T00:00:00.000Z",
})

describe("DeployEventBus", () => {
  test("delivers what is published after subscribing, never what came before", async () => {
    const bus = new DeployEventBus()
    bus.publishStarted(run("old"))
    bus.publishFinished(run("old"), { success: true, message: "ok" })

    const controller = new AbortController()
    const events = bus.subscribe(controller.signal)
    bus.publishStarted(run("new"))

    const first = await events.next()
    expect(first.value).toEqual({ type: "started", run: run("new") })
    controller.abort()
  })

  test("tracks the runs in flight from started to finished", async () => {
    const bus = new DeployEventBus()
    bus.publishStarted(run("a"))
    bus.publishStarted(run("b", "api"))
    expect(bus.running().map((r) => r.id)).toEqual(["a", "b"])

    const controller = new AbortController()
    const events = bus.subscribe(controller.signal)
    bus.publishFinished(run("a"), { success: false, message: "boom" })

    expect(bus.running().map((r) => r.id)).toEqual(["b"])
    const { value } = await events.next()
    expect(value).toMatchObject({
      type: "finished",
      run: { id: "a" },
      success: false,
      message: "boom",
    })
    controller.abort()
  })

  test("a run that already finished is not announced twice", async () => {
    const bus = new DeployEventBus()
    bus.publishStarted(run("a"))
    bus.discard("a")

    const controller = new AbortController()
    const events = bus.subscribe(controller.signal)
    bus.publishFinished(run("a"), { success: true, message: "ok" })
    bus.publishStarted(run("b"))

    const { value } = await events.next()
    expect(value).toMatchObject({ type: "started", run: { id: "b" } })
    controller.abort()
  })

  test("aborting the signal ends the iterator without an error", async () => {
    const bus = new DeployEventBus()
    const controller = new AbortController()
    const events = bus.subscribe(controller.signal)

    const pending = events.next()
    controller.abort()
    expect(await pending).toEqual({ done: true, value: undefined })
  })

  test("close ends every open subscription and the ones after it", async () => {
    const bus = new DeployEventBus()
    const first = bus.subscribe().next()
    const second = bus.subscribe().next()

    bus.close()
    expect(await first).toMatchObject({ done: true })
    expect(await second).toMatchObject({ done: true })
    expect(await bus.subscribe().next()).toMatchObject({ done: true })
  })
})

describe("deploy.watch", () => {
  const watch = (signal: AbortSignal) =>
    call(appRouter.v0.deploy.watch, undefined, {
      context: apiKeyContext(),
      signal,
    })

  test("starts with the runs in flight, then streams each change", async () => {
    const controller = new AbortController()
    deployEvents.publishStarted(run("in-flight"))

    const events = await watch(controller.signal)
    expect((await events.next()).value).toEqual({
      type: "subscribed",
      running: [run("in-flight")],
    })

    deployEvents.publishFinished(run("in-flight"), {
      success: true,
      message: "ok",
    })
    deployEvents.publishStarted(run("next", "api"))

    expect((await events.next()).value).toMatchObject({
      type: "finished",
      run: { id: "in-flight" },
      success: true,
    })
    expect((await events.next()).value).toMatchObject({
      type: "started",
      run: { id: "next", stack: "api" },
    })

    controller.abort()
    deployEvents.discard("next")
  })

  test("does not replay what finished before subscribing", async () => {
    deployEvents.publishStarted(run("done"))
    deployEvents.publishFinished(run("done"), { success: true, message: "ok" })

    const controller = new AbortController()
    const events = await watch(controller.signal)
    expect((await events.next()).value).toEqual({
      type: "subscribed",
      running: [],
    })

    const next = events.next()
    controller.abort()
    expect(await next).toMatchObject({ done: true })
  })

  test("rejects an anonymous request with 401", async () => {
    await expectErrorCode(
      call(appRouter.v0.deploy.watch, undefined, {
        context: anonymousContext(),
      }),
      "UNAUTHORIZED"
    )
  })
})
