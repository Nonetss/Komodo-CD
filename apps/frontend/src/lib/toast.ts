import { toast } from "sonner"

import { getErrorMessage } from "@/lib/orpc"

export function notifySuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined)
}

export function notifyError(message: string, description?: string) {
  toast.error(message, description ? { description } : undefined)
}

type ToastContent = { title: string; description?: string }

/**
 * Lanza una mutación y avisa del resultado con un toast. En el éxito, la
 * descripción es por defecto el `message` que devuelve el backend; en el
 * error, su mensaje oRPC (o `errorFallback` si no lo hay). Nunca lanza:
 * resuelve con el resultado o con `undefined` si ha fallado.
 */
export async function toastMutation<T>(
  run: () => Promise<T>,
  {
    success,
    error,
    errorFallback = "",
  }: {
    success: string | ((result: T) => ToastContent)
    error: string
    errorFallback?: string
  }
): Promise<T | undefined> {
  try {
    const result = await run()
    const content =
      typeof success === "function"
        ? success(result)
        : { title: success, description: backendMessage(result) }
    notifySuccess(content.title, content.description)
    return result
  } catch (err) {
    notifyError(error, getErrorMessage(err, errorFallback) || undefined)
    return undefined
  }
}

function backendMessage(result: unknown) {
  if (result && typeof result === "object" && "message" in result) {
    const { message } = result
    return typeof message === "string" && message ? message : undefined
  }
  return undefined
}
