import { z } from "zod"

export const deployAction = z
  .enum(["pull", "redeploy", "pull-redeploy"])
  .describe("Acción a ejecutar sobre el stack")

export const deployInput = {
  trigger: z.object({
    stack: z.string().min(1).describe("Nombre del stack en Komodo"),
    action: deployAction,
  }),
}
