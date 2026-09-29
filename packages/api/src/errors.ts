import type { ErrorMap } from "@orpc/server"
import { createORPCErrorConstructorMap } from "@orpc/server"

export const errorMap = {
  BAD_REQUEST: { status: 400, message: "Bad Request" },
  UNAUTHORIZED: { status: 401, message: "Unauthorized" },
  FORBIDDEN: { status: 403, message: "Forbidden" },
  NOT_FOUND: { status: 404, message: "Not Found" },
  INTERNAL_SERVER_ERROR: { status: 500, message: "Internal Server Error" },
  SERVICE_UNAVAILABLE: { status: 503, message: "Service Unavailable" },
} as const satisfies ErrorMap

export const errors = createORPCErrorConstructorMap(errorMap)
