import { Context, Handler } from "hono";
import { logger } from "@/lib/logger";
import { komodoService } from "@/services/komodo";

export const saveHandler: Handler = async (c: Context) => {
	const { name, url, key, secret } = await c.req.json();

	try {
		await komodoService.updateCredentials(name, url, key, secret);
		return c.json(
			{
				success: true,
				message: `Credenciales '${name}' guardadas correctamente`,
				name,
			},
			200,
		);
	} catch (error) {
		logger.error("❌ Error guardando credenciales:", error);
		return c.json(
			{
				success: false,
				message: error instanceof Error ? error.message : "Error desconocido",
				name,
			},
			500,
		);
	}
};
