import { z } from "zod"

export const deployOutput = {
  trigger: z.object({
    success: z.boolean(),
    message: z.string(),
    stack: z.string(),
    action: z.string(),
  }),
}
