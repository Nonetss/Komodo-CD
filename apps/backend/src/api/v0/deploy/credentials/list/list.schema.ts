import { z } from "@hono/zod-openapi";

export const ListSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	credentials: z.array(
		z.object({
			id: z.number(),
			name: z.string().nullable(),
			url: z.string().nullable(),
		}),
	),
});
