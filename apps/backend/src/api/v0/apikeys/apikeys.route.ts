import { createRoute, z } from "@hono/zod-openapi";
import {
	ApiKeyCreateBodySchema,
	ApiKeyCreatedSchema,
	ApiKeyDeleteBodySchema,
	ApiKeyListSchema,
} from "./apikeys.schema";

const ErrorSchema = z.object({ error: z.string() });

export const listApiKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["API Keys"],
	summary: "Listar API keys del usuario",
	security: [{ ApiKeyAuth: [] }],
	responses: {
		200: {
			content: { "application/json": { schema: ApiKeyListSchema } },
			description: "Lista de API keys",
		},
		401: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "No autenticado",
		},
	},
});

export const createApiKeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["API Keys"],
	summary: "Crear una API key",
	security: [{ ApiKeyAuth: [] }],
	request: {
		body: {
			content: { "application/json": { schema: ApiKeyCreateBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: ApiKeyCreatedSchema } },
			description: "API key creada. La key completa solo se muestra una vez.",
		},
		401: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "No autenticado",
		},
		500: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Error al crear la key",
		},
	},
});

export const deleteApiKeyRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["API Keys"],
	summary: "Borrar una API key",
	security: [{ ApiKeyAuth: [] }],
	request: {
		body: {
			content: { "application/json": { schema: ApiKeyDeleteBodySchema } },
		},
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: z.object({ success: z.boolean() }) },
			},
			description: "Key eliminada",
		},
		401: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "No autenticado",
		},
		500: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Error al eliminar",
		},
	},
});
