import { createRoute, z } from "@hono/zod-openapi";
import { SaveBodySchema, SaveSchema } from "./save.schema";

const ErrorSchema = z.object({
	error: z.string().openapi({ example: "Unauthorized" }),
});

export const saveRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Credentials"],
	summary: "Guardar credenciales de Komodo",
	description:
		"Almacena las credenciales (URL, key y secret) de una instancia de Komodo, " +
		"identificadas por un nombre único. Si ya existe una entrada con ese nombre, se sobreescribe. " +
		"Requiere autenticación via `x-api-key` o sesión.",
	security: [{ ApiKeyAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: SaveBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SaveSchema,
				},
			},
			description: "Credenciales guardadas correctamente",
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
