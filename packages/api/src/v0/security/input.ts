import { z } from "zod"

const imageRef = z
  .string()
  .min(1)
  .describe("Referencia de la imagen tal cual la da Komodo (p. ej. nginx:1.27)")

export const securityInput = {
  get: z.object({ image: imageRef }),
  // Sin cuerpo (o sin `images`) se escanean todas las imágenes de Komodo
  scan: z
    .object({
      images: z
        .array(imageRef)
        .min(1)
        .optional()
        .describe("Imágenes a escanear; todas las de Komodo si se omite"),
    })
    .default({}),
}
