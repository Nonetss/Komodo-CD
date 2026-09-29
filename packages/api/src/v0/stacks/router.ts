import { protectedProcedure } from "#index"
import { stacksHandler } from "#v0/stacks/handler"
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
}
