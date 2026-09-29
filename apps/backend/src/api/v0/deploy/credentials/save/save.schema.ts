import { z } from "@hono/zod-openapi";

export const SaveBodySchema = z.object({
	name: z.string().openapi({ example: "production" }),
	url: z.string().url().openapi({ example: "https://tu-komodo.com" }),
	key: z.string().openapi({ example: "tu-api-key" }),
	secret: z.string().openapi({ example: "tu-api-secret" }),
});

export const SaveSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	message: z
		.string()
		.openapi({ example: "Credenciales guardadas correctamente" }),
	name: z.string().openapi({ example: "production" }),
});
