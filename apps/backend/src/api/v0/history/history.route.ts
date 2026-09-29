import { createRoute, z } from "@hono/zod-openapi";
import { HistoryListSchema } from "./history.schema";

export const historyRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["History"],
	summary: "Historial de acciones",
	security: [{ ApiKeyAuth: [] }],
	responses: {
		200: {
			content: { "application/json": { schema: HistoryListSchema } },
			description: "Historial de deploys y pulls",
		},
		401: {
			content: {
				"application/json": { schema: z.object({ error: z.string() }) },
			},
			description: "No autenticado",
		},
	},
});
