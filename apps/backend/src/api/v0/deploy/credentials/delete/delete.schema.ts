import { z } from "@hono/zod-openapi";

export const DeleteBodySchema = z.object({
	name: z.string().openapi({ example: "production" }),
});

export const DeleteSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	message: z
		.string()
		.openapi({ example: "Credenciales eliminadas correctamente" }),
});
