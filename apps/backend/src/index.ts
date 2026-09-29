import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { Session, User } from "better-auth/types";
import { Context, Handler } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger as honoLogger } from "hono/logger";
import api from "@/api";
import { auth } from "@/core/auth";
import { bootstrap } from "@/lib/bootstrap";
import { logger } from "@/lib/logger";
import { authMiddleware } from "@/middleware";

const app = new OpenAPIHono<{
	Variables: {
		user: User | null;
		session: Session | null;
	};
}>();

app.openAPIRegistry.registerComponent("securitySchemes", "ApiKeyAuth", {
	type: "apiKey",
	in: "header",
	name: "x-api-key",
	description:
		"API Key generada desde Better Auth. Pásala en el header `x-api-key`.",
});

app.onError((err, c) => {
	logger.error(`${err}`);
	const status = err instanceof HTTPException ? err.status : 500;
	return c.json({ error: err.message }, status);
});

app.use(
	"*",
	cors({
		origin: (origin) => origin || "*",
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
		allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	}),
);
app.use("*", honoLogger());
app.use("/api/v0/*", authMiddleware);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

const rootSchema = z.object({
	message: z.string().openapi({ example: "API is running" }),
});

const rootRoute = createRoute({
	method: "get",
	path: "/health-check",
	tags: ["Health Check"],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: rootSchema,
				},
			},
			description: "Health Check endpoint",
		},
	},
});

const rootHandler: Handler = (c: Context) => {
	return c.json({ message: "API is running" });
};

app.openapi(rootRoute, rootHandler);

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "Komodo Action API",
		description:
			"API para gestionar credenciales de Komodo y disparar deploys. " +
			"Todos los endpoints requieren autenticación mediante API Key (`x-api-key`) o sesión de usuario.",
	},
});

app.get("/scalar", Scalar({ url: "/doc" }));

app.route("/", api);

// Ejecutar bootstrap e iniciar servicios al iniciar
bootstrap().then(() => {
	const server = Bun.serve({ port: 3000, fetch: app.fetch });
	logger.info("🌐 Servidor corriendo en http://localhost:3000");

	const shutdown = async () => {
		logger.info("🛑 Señal de apagado recibida, cerrando servidor...");
		server.stop();
		logger.info("✅ Servidor cerrado correctamente");
		process.exit(0);
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
});
