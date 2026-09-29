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
