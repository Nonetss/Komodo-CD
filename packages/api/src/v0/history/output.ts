import { z } from "zod"

export const historyOutput = {
  list: z.object({
    success: z.boolean(),
    history: z.array(
      z.object({
        id: z.number(),
        userId: z.string(),
        userName: z.string().nullable(),
        userEmail: z.string().nullable(),
        // Quién lo lanzó, deducido de lo guardado (ver @komodo-cd/auth/actor)
        via: z.enum(["session", "apiKey"]),
        actorName: z.string().nullable(),
        stack: z.string(),
        action: z.string(),
        success: z.boolean(),
        message: z.string().nullable(),
        createdAt: z.string(),
      })
    ),
  }),
  activity: z.object({
    success: z.boolean(),
    // Inicio de la ventana pedida, en ISO
    since: z.string(),
    // `true` si había más eventos que `ACTIVITY_LIMIT` y se cortó la ventana
    truncated: z.boolean(),
    events: z.array(
      z.object({
        stack: z.string(),
        action: z.string(),
        success: z.boolean(),
        via: z.enum(["session", "apiKey"]),
        createdAt: z.string(),
      })
    ),
  }),
}
