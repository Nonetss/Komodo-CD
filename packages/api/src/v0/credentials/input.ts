import { z } from "zod"

export const credentialsInput = {
  save: z.object({
    name: z.string().min(1).describe("Nombre identificativo de la instancia"),
    url: z.url().describe("URL de la instancia de Komodo"),
    key: z.string().min(1).describe("API key de Komodo"),
    secret: z.string().min(1).describe("API secret de Komodo"),
  }),
  remove: z.object({
    name: z.string().min(1).describe("Nombre de las credenciales a eliminar"),
  }),
}

// Nombres de topic válidos en ntfy: [-_A-Za-z0-9], hasta 64 caracteres
const ntfyTopic = z
  .string()
  .regex(/^[-_A-Za-z0-9]{1,64}$/)
  .describe("Topic de ntfy al que se publican los avisos")

const ntfyTarget = z.object({
  url: z.url().describe("URL del servidor ntfy (p. ej. https://ntfy.sh)"),
  topic: ntfyTopic,
  token: z
    .string()
    .optional()
    .describe(
      "Access token de ntfy (`tk_…`), solo para topics protegidos. Al guardar, " +
        'omitirlo conserva el token actual y `""` lo elimina.'
    ),
})

export const ntfyInput = {
  save: ntfyTarget.extend({
    enabled: z
      .boolean()
      .default(true)
      .describe("Enviar avisos cuando falle un deploy"),
  }),
  // Sin cuerpo prueba la configuración guardada; con cuerpo, la del formulario
  // antes de guardarla.
  test: ntfyTarget.optional(),
}
