import { Context } from "hono";
import { auth } from "@/core/auth";
import { logger } from "@/lib/logger";

function getBetterAuthHeaders(c: Context): HeadersInit {
	// Better Auth consume cookies desde la cabecera `cookie`.
	// Usamos las headers reales del request original para que validaciones
	// (origin/trustedOrigins) y la cookie de sesión cuadren.
	return c.req.raw.headers;
}

export const listApiKeysHandler = async (c: Context) => {
	try {
		const result = await auth.api.listApiKeys({
			headers: getBetterAuthHeaders(c),
			query: {},
		});

		const keys = (result?.apiKeys ?? []).map((k: any) => ({
			id: k.id,
			name: k.name ?? null,
			start: k.start ?? null,
			createdAt: k.createdAt
				? new Date(k.createdAt).toISOString()
				: new Date().toISOString(),
			expiresAt: k.expiresAt ? new Date(k.expiresAt).toISOString() : null,
		}));
		return c.json({ success: true, keys });
	} catch (error: any) {
		logger.error(
			"❌ Error listando API keys:",
			error?.message ?? String(error),
		);
		return c.json({ error: "Error al listar API keys" }, 500);
	}
};

export const createApiKeyHandler = async (c: Context) => {
	const { name } = await c.req.json();
	try {
		const data = await auth.api.createApiKey({
			headers: getBetterAuthHeaders(c),
			body: {
				name,
			},
		});

		return c.json({
			success: true,
			key: data.key,
			id: data.id,
			name: data.name ?? null,
		});
	} catch (error: any) {
		logger.error("❌ Error creando API key:", error?.message ?? String(error));
		return c.json({ error: "Error al crear la API key" }, 500);
	}
};

export const deleteApiKeyHandler = async (c: Context) => {
	const { id } = await c.req.json();
	try {
		await auth.api.deleteApiKey({
			headers: getBetterAuthHeaders(c),
			body: { keyId: id },
		});
		return c.json({ success: true });
	} catch (error: any) {
		logger.error(
			"❌ Error eliminando API key:",
			error?.message ?? String(error),
		);
		return c.json({ error: "Error al eliminar la API key" }, 500);
	}
};
