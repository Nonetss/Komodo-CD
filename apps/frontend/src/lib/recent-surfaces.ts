/** Cuántas páginas visitadas recuerda el buscador de la barra superior */
export const RECENT_SURFACES_LIMIT = 5

const STORAGE_PREFIX = "recent-surfaces:"

/**
 * Rutas de las páginas que el usuario visitó hace menos, de la más reciente
 * a la más antigua, en `localStorage` y por usuario para que un navegador
 * compartido no mezcle historiales. Si leer falla (modo privado, JSON roto)
 * devuelve una lista vacía en vez de lanzar.
 */
export function readRecentSurfaces(userId: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((href): href is string => typeof href === "string")
      .slice(0, RECENT_SURFACES_LIMIT)
  } catch {
    return []
  }
}

/** Pone `href` el primero de la lista del usuario y devuelve la lista nueva. */
export function recordRecentSurface(userId: string, href: string): string[] {
  const next = [
    href,
    ...readRecentSurfaces(userId).filter((item) => item !== href),
  ].slice(0, RECENT_SURFACES_LIMIT)
  if (typeof window === "undefined") return next
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(next))
  } catch {
    // Sin cuota o en modo privado: la lista vive solo en memoria
  }
  return next
}
