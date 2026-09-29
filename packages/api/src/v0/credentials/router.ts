import { protectedProcedure } from "#index"
import { credentialsHandler } from "#v0/credentials/handler"
import { credentialsInput } from "#v0/credentials/input"
import { credentialsOutput } from "#v0/credentials/output"

export const credentialsRouter = {
  list: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/deploy/credentials",
      summary: "Listar credenciales de Komodo",
      description:
        "Devuelve todas las instancias de Komodo configuradas. " +
        "Los campos `key` y `secret` nunca se exponen en la respuesta.",
      tags: ["Credentials"],
    })
    .output(credentialsOutput.list)
    .handler(() => credentialsHandler.list()),

  save: protectedProcedure
    .route({
      method: "POST",
      path: "/v0/deploy/credentials",
      summary: "Guardar credenciales de Komodo",
      description:
        "Almacena las credenciales (URL, key y secret) de la instancia de Komodo. " +
        "Si ya hay credenciales guardadas, se sobreescriben.",
      tags: ["Credentials"],
    })
    .input(credentialsInput.save)
    .output(credentialsOutput.save)
    .handler(({ input }) => credentialsHandler.save({ input })),

  remove: protectedProcedure
    .route({
      method: "DELETE",
      path: "/v0/deploy/credentials",
      summary: "Eliminar credenciales de Komodo",
      tags: ["Credentials"],
    })
    .input(credentialsInput.remove)
    .output(credentialsOutput.remove)
    .handler(({ input }) => credentialsHandler.remove({ input })),
}
