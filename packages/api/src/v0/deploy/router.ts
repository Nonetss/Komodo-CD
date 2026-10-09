import { eventIterator } from "@orpc/server"

import { protectedProcedure } from "#index"
import { deployHandler } from "#v0/deploy/handler"
import { deployInput } from "#v0/deploy/input"
import { deployOutput } from "#v0/deploy/output"

export const deployRouter = {
  trigger: protectedProcedure
    .route({
      method: "POST",
      path: "/v0/deploy",
      summary: "Disparar un deploy en Komodo",
      description:
        "Ejecuta una acción (`pull`, `redeploy` o `pull-redeploy`) sobre un stack de Komodo. " +
        "Compatible con GitHub Actions y Gitea Actions. " +
        "Requiere autenticación via `x-api-key` o sesión.",
      tags: ["Deploy"],
    })
    .input(deployInput.trigger)
    .output(deployOutput.trigger)
    .handler(({ context, input }) =>
      deployHandler.trigger({ user: context.user, input })
    ),
  watch: protectedProcedure
    .route({
      method: "GET",
      path: "/v0/deploy/events",
      summary: "Seguir los deploys en vivo",
      description:
        "Stream SSE con la actividad de deploys de cualquier origen (dashboard o CI). " +
        "Primero envía `subscribed` con los deploys en curso y después un evento " +
        "`started` o `finished` por cada cambio. No repite eventos anteriores. " +
        "Requiere autenticación via `x-api-key` o sesión.",
      tags: ["Deploy"],
    })
    .output(eventIterator(deployOutput.event))
    .handler(({ signal }) => deployHandler.watch({ signal })),
}
