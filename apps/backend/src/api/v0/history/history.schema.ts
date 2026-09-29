import { z } from "@hono/zod-openapi";

export const HistoryItemSchema = z
	.object({
		id: z.number(),
		userId: z.string(),
		userName: z.string().nullable(),
		userEmail: z.string().nullable(),
		stack: z.string(),
		action: z.string(),
		success: z.boolean(),
		message: z.string().nullable(),
		createdAt: z.string(),
	})
	.openapi("HistoryItem");

export const HistoryListSchema = z
	.object({
		success: z.boolean(),
		history: z.array(HistoryItemSchema),
	})
	.openapi("HistoryList");
