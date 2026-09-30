import { z } from "zod"

export const credentialsOutput = {
  list: z.object({
    success: z.boolean(),
    credentials: z.array(
      z.object({
        id: z.number(),
        name: z.string().nullable(),
        url: z.string().nullable(),
      })
    ),
  }),
  save: z.object({
    success: z.boolean(),
    message: z.string(),
    name: z.string(),
  }),
  remove: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
}

const result = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const ntfyOutput = {
  get: z.object({
    success: z.boolean(),
    // El token nunca sale del backend: solo si hay uno guardado
    config: z
      .object({
        url: z.string(),
        topic: z.string(),
        hasToken: z.boolean(),
        enabled: z.boolean(),
      })
      .nullable(),
  }),
  save: result,
  remove: result,
  test: result,
}
