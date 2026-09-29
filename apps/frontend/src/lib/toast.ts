import { toast } from "sonner"

export function notifySuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined)
}

export function notifyError(message: string, description?: string) {
  toast.error(message, description ? { description } : undefined)
}
