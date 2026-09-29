import { Context, Handler } from "hono";
import { logger } from "@/lib/logger";
import { komodoService } from "@/services/komodo";

export const listHandler: Handler = async (c: Context) => {
	try {
		const all = await komodoService.listCredentials();
		const credentials = all.map((c) => ({
			id: c.id,
			name: c.name,
			url: c.url,
		}));
		return c.json({ success: true, credentials }, 200);
	} catch (error) {
		logger.error("❌ Error listando credenciales:", error);
		return c.json({ success: false, credentials: [] }, 500);
	}
};
