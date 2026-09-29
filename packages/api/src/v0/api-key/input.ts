import { z } from "zod"

export const apiKeyInput = {
  create: z.object({
    name: z.string().min(1).describe("Nombre de la API key"),
  }),
  remove: z.object({
    id: z.string().min(1).describe("Id de la API key a eliminar"),
  }),
}
