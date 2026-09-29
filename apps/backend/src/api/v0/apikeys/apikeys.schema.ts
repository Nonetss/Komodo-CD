import { z } from "@hono/zod-openapi";

export const ApiKeyItemSchema = z
	.object({
		id: z.string(),
		name: z.string().nullable(),
		start: z.string().nullable(),
		createdAt: z.string(),
		expiresAt: z.string().nullable(),
	})
	.openapi("ApiKeyItem");

export const ApiKeyListSchema = z
	.object({
		success: z.boolean(),
		keys: z.array(ApiKeyItemSchema),
	})
	.openapi("ApiKeyList");

export const ApiKeyCreateBodySchema = z
	.object({
		name: z.string().min(1).openapi({ example: "github-actions" }),
	})
	.openapi("ApiKeyCreateBody");

export const ApiKeyCreatedSchema = z
	.object({
		success: z.boolean(),
		key: z.string().openapi({
			description: "La API key completa. Guárdala, no se mostrará de nuevo.",
		}),
		id: z.string(),
		name: z.string().nullable(),
	})
	.openapi("ApiKeyCreated");

export const ApiKeyDeleteBodySchema = z
	.object({
		id: z.string().openapi({ example: "key_abc123" }),
	})
	.openapi("ApiKeyDeleteBody");
