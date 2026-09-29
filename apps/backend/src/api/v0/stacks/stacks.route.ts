import { createRoute, z } from "@hono/zod-openapi";
import { StacksListSchema } from "./stacks.schema";

const ErrorSchema = z.object({ error: z.string() });

export const stacksRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Stacks"],
	summary: "Listar stacks de Komodo",
	security: [{ ApiKeyAuth: [] }],
	responses: {
		200: {
			content: { "application/json": { schema: StacksListSchema } },
			description: "Lista de stacks en Komodo",
		},
		401: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "No autenticado",
		},
		500: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Error al obtener stacks de Komodo",
		},
	},
});
