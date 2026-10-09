import { z } from "zod"

export const stacksInput = {
  remove: z.object({
    stack: z.string().min(1).describe("Nombre o id del stack en Komodo"),
  }),
}
