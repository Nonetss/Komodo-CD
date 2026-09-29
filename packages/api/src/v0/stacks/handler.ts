import { errors } from "#errors"
import { komodoErrorMessage, komodoService } from "#lib/komodo"
import type { StackItem } from "#v0/stacks/output"

export const stacksHandler = {
  list: async () => {
    try {
      const stacks = await komodoService.listAllStacks()
      // Los tipos de komodo_client no llevan index signature ni `null`; el
      // contrato real lo valida `stacksOutput.list` al salir.
      return { success: true, stacks: stacks as unknown as StackItem[] }
    } catch (err) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: komodoErrorMessage(err),
        cause: err,
      })
    }
  },
}
