import type { z } from "zod"

import { errors } from "#errors"
import { komodoService } from "#lib/komodo"
import { ntfyService } from "#lib/ntfy"
import type { credentialsInput, ntfyInput } from "#v0/credentials/input"

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

export const ntfyHandler = {
  get: async () => {
    const config = await ntfyService.getConfig()
    return {
      success: true,
      config: config && {
        url: config.url,
        topic: config.topic,
        hasToken: !!config.token,
        enabled: config.enabled,
      },
    }
  },

  save: async ({ input }: { input: z.infer<typeof ntfyInput.save> }) => {
    await ntfyService.saveConfig(input)
    return {
      success: true,
      message: `Notificaciones configuradas en '${input.topic}'`,
    }
  },

  remove: async () => {
    await ntfyService.deleteConfig()
    return { success: true, message: "Notificaciones de ntfy desactivadas" }
  },

  test: async ({ input }: { input: z.infer<typeof ntfyInput.test> }) => {
    const saved = await ntfyService.getConfig()
    // Como al guardar: sin token en el cuerpo se prueba con el guardado
    const target = input
      ? { ...input, token: input.token ?? saved?.token }
      : saved
    if (!target) {
      throw errors.BAD_REQUEST({ message: "ntfy no está configurado" })
    }

    try {
      await ntfyService.publish(target, {
        title: "Komodo CD",
        message: "Notificación de prueba: los deploys fallidos llegarán aquí.",
        tags: ["white_check_mark"],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw errors.BAD_REQUEST({ message, cause: err })
    }
    return { success: true, message: `Enviada a '${target.topic}'` }
  },
}
