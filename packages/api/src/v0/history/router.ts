import { protectedProcedure } from "#index"
import { historyHandler } from "#v0/history/handler"
import { historyOutput } from "#v0/history/output"

export const historyRouter = {
  list: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/history",
      summary: "Historial de acciones",
      description: "Últimos 100 deploys y pulls.",
      tags: ["History"],
    })
    .output(historyOutput.list)
    .handler(() => historyHandler.list()),
}
