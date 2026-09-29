import { z } from "zod"

export const credentialsOutput = {
  list: z.object({
    success: z.boolean(),
    credentials: z.array(
      z.object({
        id: z.number(),
        name: z.string().nullable(),
        url: z.string().nullable(),
      })
    ),
  }),
  save: z.object({
    success: z.boolean(),
    message: z.string(),
    name: z.string(),
  }),
  remove: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
}
