import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * `true` solo cuando el árbol de React ya ha hidratado en el cliente.
 *
 * Con `useSyncExternalStore`, el servidor y el primer render del cliente ven
 * `false`, así que no hay desajustes aunque TanStack Query encuentre la caché
 * del navegador ya caliente (otra isla o una navegación anterior la llenó).
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
