import { protectedProcedure } from "#index"
import { securityHandler } from "#v0/security/handler"
import { securityInput } from "#v0/security/input"
import { securityOutput } from "#v0/security/output"

export const securityRouter = {
  list: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/security/images",
      summary: "Listar imágenes y sus vulnerabilidades",
      description:
        "Imágenes de los stacks de Komodo con los stacks que las usan y el resumen " +
        "de su último escaneo de Trivy. Encola las que aún no tienen información. " +
        "`enabled` es `false` sin servidor de Trivy configurado.",
      tags: ["Security"],
    })
    .output(securityOutput.list)
    .handler(() => securityHandler.list()),
  get: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/security/image",
      summary: "Vulnerabilidades de una imagen",
      description:
        "Último escaneo de una imagen (`?image=nginx:1.27`) con todas sus " +
        "vulnerabilidades, de la más grave a la menos.",
      tags: ["Security"],
    })
    .input(securityInput.get)
    .output(securityOutput.get)
    .handler(({ input }) => securityHandler.get({ input })),
  scan: protectedProcedure
    .route({
      method: "POST",
      path: "/v0/security/scan",
      summary: "Escanear imágenes",
      description:
        "Encola el escaneo de las imágenes indicadas, o de todas las de Komodo sin " +
        "`images`. Solo acepta imágenes que use algún stack. Devuelve las que " +
        "quedaron en cola (las que ya lo estaban no se repiten).",
      tags: ["Security"],
    })
    .input(securityInput.scan)
    .output(securityOutput.scan)
    .handler(({ input }) => securityHandler.scan({ input })),
}
