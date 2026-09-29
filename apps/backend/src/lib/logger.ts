import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport: isProduction
		? undefined // En producción logueamos JSON puro (más rápido y compatible)
		: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "UTC:yyyy-mm-dd HH:MM:ss 'UTC'",
					ignore: "pid,hostname",
				},
			},
});
