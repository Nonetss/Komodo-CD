import { env } from "@komodo-cd/env/server"
import pino, { type Logger } from "pino"
import pretty from "pino-pretty"

// Stream síncrono en lugar de `transport`: los transports de pino resuelven
// módulos en un worker thread, lo que falla si alguna app se empaqueta.
export const logger: Logger = pino(
  { level: env.LOG_LEVEL },
  env.NODE_ENV === "production"
    ? process.stdout
    : pretty({
        colorize: true,
        translateTime: "UTC:yyyy-mm-dd HH:MM:ss 'UTC'",
        ignore: "pid,hostname",
      })
)
