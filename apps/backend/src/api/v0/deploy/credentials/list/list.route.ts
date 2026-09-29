import { createRoute, z } from "@hono/zod-openapi";
import { ListSchema } from "./list.schema";

const ErrorSchema = z.object({
	error: z.string().openapi({ example: "Unauthorized" }),
});

export const listRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Credentials"],
	summary: "Listar credenciales de Komodo",
	description:
		"Devuelve todas las instancias de Komodo configuradas. " +
		"Los campos `key` y `secret` nunca se exponen en la respuesta. " +
		"Requiere autenticación via `x-api-key` o sesión.",
	security: [{ ApiKeyAuth: [] }],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ListSchema,
				},
			},
			description: "Lista de credenciales (sin key ni secret)",
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
