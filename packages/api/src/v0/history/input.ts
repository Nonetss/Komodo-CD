import { z } from "zod"

export const historyInput = {
  // Sin `days` (o sin query) se devuelven los últimos 30 días
  activity: z
    .object({
      days: z.coerce
        .number()
        .int()
        .min(1)
        .max(90)
        .default(30)
        .describe("Días hacia atrás, de 1 a 90 (30 por defecto)"),
    })
    .prefault({}),
}
