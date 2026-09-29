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
}
