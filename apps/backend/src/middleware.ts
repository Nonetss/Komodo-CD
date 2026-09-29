import type { Session, User } from "better-auth/types";
import type { Context } from "hono";
import type { Next } from "hono/types";
import { auth } from "@/core/auth";

export const authMiddleware = async (c: Context, next: Next) => {
	const apiKeyHeader = c.req.header("x-api-key");

	if (apiKeyHeader) {
		const verifyApiKey = (auth.api as Record<string, Function>)["verifyApiKey"];
		const result = await verifyApiKey({ body: { key: apiKeyHeader } });
		if (!result?.valid || !result?.key) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		const userId = result.key.userId ?? result.key.referenceId ?? "api-key";
		const keyName = result.key.name ? `API Key: ${result.key.name}` : "API Key";
		c.set("user", { id: userId, name: keyName } as User);
		c.set("session", null);
		await next();
		return;
	}

	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	c.set("user", session.user as User);
	c.set("session", session.session as Session);
	await next();
};
