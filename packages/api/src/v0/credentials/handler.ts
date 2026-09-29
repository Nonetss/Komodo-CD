import type { z } from "zod"

import { komodoService } from "#lib/komodo"
import type { credentialsInput } from "#v0/credentials/input"

export const credentialsHandler = {
  list: async () => {
    const all = await komodoService.listCredentials()
    // key y secret nunca salen del backend
    const credentials = all.map(({ id, name, url }) => ({ id, name, url }))
    return { success: true, credentials }
  },

  save: async ({ input }: { input: z.infer<typeof credentialsInput.save> }) => {
    await komodoService.updateCredentials(input)
    return {
      success: true,
      message: `Credenciales '${input.name}' guardadas correctamente`,
      name: input.name,
    }
  },

  remove: async ({
    input,
  }: {
    input: z.infer<typeof credentialsInput.remove>
  }) => {
    await komodoService.deleteCredentials(input.name)
    return {
      success: true,
      message: `Credenciales '${input.name}' eliminadas correctamente`,
    }
  },
}
