import { createRoute, z } from "@hono/zod-openapi";
import { TriggerBodySchema, TriggerSchema } from "./trigger.schema";

const ErrorSchema = z.object({
	error: z.string().openapi({ example: "Unauthorized" }),
});

export const triggerRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Deploy"],
	summary: "Disparar un deploy en Komodo",
	description:
		"Ejecuta una o varias acciones (`build`, `pull`, `redeploy`) sobre un stack de Komodo. " +
		"Compatible con GitHub Actions y Gitea Actions. " +
		"Requiere autenticación via `x-api-key` o sesión.",
	security: [{ ApiKeyAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: TriggerBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TriggerSchema,
				},
			},
			description: "Acción ejecutada correctamente sobre el stack",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "No autenticado. Incluye un header `x-api-key` válido.",
		},
		500: {
			content: {
				"application/json": {
					schema: TriggerSchema,
				},
			},
			description: "Error al ejecutar la acción en Komodo",
		},
	},
});
