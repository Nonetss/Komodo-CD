import { z } from "zod"

// Una ejecución de `deploy.trigger` tal como la anuncia `deploy.watch`
const deployRun = z.object({
  id: z.string(),
  stack: z.string(),
  action: z.string(),
  // Quién lo lanzó, igual que en el historial (ver @komodo-cd/auth/actor)
  via: z.enum(["session", "apiKey"]),
  actorName: z.string().nullable(),
  startedAt: z.string(),
})

export const deployOutput = {
  trigger: z.object({
    success: z.boolean(),
    message: z.string(),
    stack: z.string(),
    action: z.string(),
  }),
  event: z.discriminatedUnion("type", [
    z.object({ type: z.literal("subscribed"), running: z.array(deployRun) }),
    z.object({ type: z.literal("started"), run: deployRun }),
    z.object({
      type: z.literal("finished"),
      run: deployRun,
      success: z.boolean(),
      message: z.string(),
      finishedAt: z.string(),
    }),
  ]),
}
