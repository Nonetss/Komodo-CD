import { protectedProcedure } from "#index"
import { historyHandler } from "#v0/history/handler"
import { historyInput } from "#v0/history/input"
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
  activity: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/history/activity",
      summary: "Actividad de despliegues",
      description:
        "Deploys y pulls de los últimos `days` días (30 por defecto, hasta 90), " +
        "del más reciente al más antiguo, para calcular cifras. `truncated` es " +
        "`true` si se cortó en 10 000 eventos.",
      tags: ["History"],
    })
    .input(historyInput.activity)
    .output(historyOutput.activity)
    .handler(({ input }) => historyHandler.activity({ input })),
}
