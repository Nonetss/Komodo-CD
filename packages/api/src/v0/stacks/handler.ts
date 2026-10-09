import type { z } from "zod"

import { komodoService, toKomodoError } from "#lib/komodo"
import type { stacksInput } from "#v0/stacks/input"
import type { StackItem } from "#v0/stacks/output"

export const stacksHandler = {
  list: async () => {
    try {
      const stacks = await komodoService.listAllStacks()
      // Los tipos de komodo_client no llevan index signature ni `null`; el
      // contrato real lo valida `stacksOutput.list` al salir.
      return { success: true, stacks: stacks as unknown as StackItem[] }
    } catch (err) {
      throw toKomodoError(err)
    }
  },

  remove: async ({ input }: { input: z.infer<typeof stacksInput.remove> }) => {
    try {
      await komodoService.deleteStack(input.stack)
      return {
        success: true,
        stack: input.stack,
        message: `Stack '${input.stack}' eliminado de Komodo`,
      }
    } catch (err) {
      throw toKomodoError(err)
    }
  },
}
