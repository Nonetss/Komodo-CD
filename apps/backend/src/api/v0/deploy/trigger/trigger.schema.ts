import { z } from "@hono/zod-openapi";

export const TriggerBodySchema = z.object({
	stack: z.string().openapi({ example: "mi-stack" }),
	action: z
		.enum(["pull", "redeploy", "pull-redeploy"])
		.openapi({ example: "redeploy" }),
});

export const TriggerSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	message: z.string().openapi({ example: "Deploy iniciado correctamente" }),
	stack: z.string().openapi({ example: "mi-stack" }),
	action: z.string().openapi({ example: "build-pull-redeploy" }),
});
