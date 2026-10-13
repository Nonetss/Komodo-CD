import type { Types } from "komodo_client"

/**
 * Un `UpdateListItem` de Komodo: por defecto, un `DeployStack` terminado bien
 * del stack `id-<stack>` (el id que da `komodoStack`).
 */
export function komodoUpdate(
  stack: string,
  startedAt: Date,
  // `operation` y `status` como texto: en komodo_client son enums
  overrides: Omit<Partial<Types.UpdateListItem>, "operation" | "status"> & {
    operation?: string
    status?: string
  } = {}
) {
  return {
    id: `update-${stack}-${startedAt.getTime()}`,
    operation: "DeployStack",
    start_ts: startedAt.getTime(),
    success: true,
    username: "admin",
    operator: "user-1",
    target: { type: "Stack", id: `id-${stack}` },
    status: "Complete",
    ...overrides,
  } as unknown as Types.UpdateListItem
}
