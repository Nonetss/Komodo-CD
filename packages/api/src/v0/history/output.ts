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
        stack: z.string(),
        action: z.string(),
        success: z.boolean(),
        message: z.string().nullable(),
        createdAt: z.string(),
      })
    ),
  }),
}
