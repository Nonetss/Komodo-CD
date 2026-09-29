import { z } from "zod"

export const apiKeyOutput = {
  list: z.object({
    success: z.boolean(),
    keys: z.array(
      z.object({
        id: z.string(),
        name: z.string().nullable(),
        start: z.string().nullable(),
        createdAt: z.string(),
        expiresAt: z.string().nullable(),
      })
    ),
  }),
  create: z.object({
    success: z.boolean(),
    key: z
      .string()
      .describe("La API key completa. Guárdala, no se mostrará de nuevo."),
    id: z.string(),
    name: z.string().nullable(),
  }),
  remove: z.object({
    success: z.boolean(),
  }),
}
