import { createRoute, z } from "@hono/zod-openapi";
import { DeleteBodySchema, DeleteSchema } from "./delete.schema";

const ErrorSchema = z.object({
	error: z.string().openapi({ example: "Unauthorized" }),
});

export const deleteRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Credentials"],
	summary: "Eliminar credenciales de Komodo",
	description:
		"Elimina las credenciales de una instancia de Komodo por nombre. " +
		"Requiere autenticación via `x-api-key` o sesión.",
	security: [{ ApiKeyAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: DeleteBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: DeleteSchema,
				},
			},
			description: "Credenciales eliminadas correctamente",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "No autenticado. Incluye un header `x-api-key` válido.",
		},
	},
});
