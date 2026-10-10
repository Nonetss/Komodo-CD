import { protectedProcedure, sessionProcedure } from "#index"
import { stacksHandler } from "#v0/stacks/handler"
import { stacksInput } from "#v0/stacks/input"
import { stacksOutput } from "#v0/stacks/output"

export const stacksRouter = {
  list: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/stacks",
      summary: "Listar stacks de Komodo",
      tags: ["Stacks"],
    })
    .output(stacksOutput.list)
    .handler(() => stacksHandler.list()),

  remove: sessionProcedure
    .route({
      method: "DELETE",
      path: "/v0/stacks/{stack}",
      summary: "Eliminar un stack de Komodo",
      description:
        "Borra el stack en Komodo (`DeleteStack`); si está en marcha, Komodo " +
        "baja antes sus contenedores. Requiere una sesión iniciada: una API " +
        "key no puede borrar stacks.",
      tags: ["Stacks"],
    })
    .input(stacksInput.remove)
    .output(stacksOutput.remove)
    .handler(({ input }) => stacksHandler.remove({ input })),

  pollForUpdates: sessionProcedure
    .route({
      method: "PUT",
      path: "/v0/stacks/{stack}/poll-for-updates",
      summary: "Activar o desactivar Poll for Updates en un stack",
      description:
        "Cambia `poll_for_updates` en la config del stack (`UpdateStack`): " +
        "con él activo, el Global Auto Update de Komodo comprueba si hay " +
        "imágenes nuevas. Requiere una sesión iniciada: una API key no puede " +
        "cambiar la config de un stack.",
      tags: ["Stacks"],
    })
    .input(stacksInput.pollForUpdates)
    .output(stacksOutput.pollForUpdates)
    .handler(({ input }) => stacksHandler.pollForUpdates({ input })),
}
