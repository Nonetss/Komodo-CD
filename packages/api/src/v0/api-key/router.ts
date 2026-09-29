import { protectedProcedure } from "#index"
import { apiKeyHandler } from "#v0/api-key/handler"
import { apiKeyInput } from "#v0/api-key/input"
import { apiKeyOutput } from "#v0/api-key/output"

export const apiKeyRouter = {
  list: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/apikeys",
      summary: "Listar API keys del usuario",
      tags: ["API Keys"],
    })
    .output(apiKeyOutput.list)
    .handler(({ context }) => apiKeyHandler.list({ context })),

  create: protectedProcedure
    .route({
      method: "POST",
      path: "/v0/apikeys",
      summary: "Crear una API key",
      description: "La key completa solo se devuelve una vez.",
      tags: ["API Keys"],
    })
    .input(apiKeyInput.create)
    .output(apiKeyOutput.create)
    .handler(({ context, input }) => apiKeyHandler.create({ context, input })),

  remove: protectedProcedure
    .route({
      method: "DELETE",
      path: "/v0/apikeys",
      summary: "Borrar una API key",
      tags: ["API Keys"],
    })
    .input(apiKeyInput.remove)
    .output(apiKeyOutput.remove)
    .handler(({ context, input }) => apiKeyHandler.remove({ context, input })),
}
