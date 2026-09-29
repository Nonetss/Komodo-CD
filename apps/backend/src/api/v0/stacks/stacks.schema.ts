import { z } from "@hono/zod-openapi";

export const StackItemSchema = z
	.object({
		id: z.string(),
		name: z.string(),
	})
	.passthrough()
	.openapi("StackItem");

export const StacksListSchema = z
	.object({
		success: z.boolean(),
		stacks: z.array(StackItemSchema),
	})
	.openapi("StacksList");
