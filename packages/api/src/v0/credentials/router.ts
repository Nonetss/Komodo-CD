import { protectedProcedure } from "#index"
import { credentialsHandler, ntfyHandler } from "#v0/credentials/handler"
import { credentialsInput, ntfyInput } from "#v0/credentials/input"
import { credentialsOutput, ntfyOutput } from "#v0/credentials/output"

const ntfyRouter = {
  get: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/deploy/credentials/ntfy",
      summary: "Ver configuración de ntfy",
      description:
        "Devuelve el servidor y topic de ntfy donde se avisa de los deploys fallidos. " +
        "El token nunca se expone en la respuesta.",
      tags: ["Credentials"],
    })
    .output(ntfyOutput.get)
    .handler(() => ntfyHandler.get()),

  save: protectedProcedure
    .route({
      method: "POST",
      path: "/v0/deploy/credentials/ntfy",
      summary: "Guardar configuración de ntfy",
      description:
        "Configura el servidor, topic y token (opcional) de ntfy. " +
        "Si ya había una configuración, se sobreescribe.",
      tags: ["Credentials"],
    })
    .input(ntfyInput.save)
    .output(ntfyOutput.save)
    .handler(({ input }) => ntfyHandler.save({ input })),

  remove: protectedProcedure
    .route({
      method: "DELETE",
      path: "/v0/deploy/credentials/ntfy",
      summary: "Eliminar configuración de ntfy",
      tags: ["Credentials"],
    })
    .output(ntfyOutput.remove)
    .handler(() => ntfyHandler.remove()),

  test: protectedProcedure
    .route({
      method: "POST",
      path: "/v0/deploy/credentials/ntfy/test",
      summary: "Enviar notificación de prueba a ntfy",
      description:
        "Sin cuerpo usa la configuración guardada; con cuerpo prueba la indicada.",
      tags: ["Credentials"],
    })
    .input(ntfyInput.test)
    .output(ntfyOutput.test)
    .handler(({ input }) => ntfyHandler.test({ input })),
}

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

  ntfy: ntfyRouter,
}
