import { expect } from "bun:test"
import { ORPCError } from "@orpc/server"

/** Espera que `promise` falle con un ORPCError de ese código y lo devuelve. */
export async function expectErrorCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => {
      throw new Error(`expected ${code}, but the call succeeded`)
    },
    (e: unknown) => e
  )
  expect(err).toBeInstanceOf(ORPCError)
  expect((err as ORPCError<string, unknown>).code).toBe(code)
  return err as ORPCError<string, unknown>
}
