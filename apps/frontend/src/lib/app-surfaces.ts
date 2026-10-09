import {
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Rocket,
  Server,
  ShieldAlert,
} from "lucide-react"

export type SurfaceId =
  | "overview"
  | "stacks"
  | "deploy"
  | "history"
  | "security"
  | "credentials"
  | "apikeys"

export type AppSurface = {
  id: SurfaceId
  path: string
  /** Icono canónico: el mismo en la navegación y en la cabecera de la página */
  icon: LucideIcon
}

/**
 * Registro único de páginas, como `app-surfaces.ts` en console: la barra
 * lateral, la barra inferior y cada `PageHero` leen de aquí, así que cambiar
 * un icono lo cambia en todas partes. Las etiquetas viven en i18n (`nav.<id>`).
 */
export const APP_SURFACES: AppSurface[] = [
  { id: "overview", path: "/", icon: LayoutDashboard },
  { id: "stacks", path: "/stacks", icon: Layers },
  { id: "deploy", path: "/deploy", icon: Rocket },
  { id: "history", path: "/history", icon: History },
  { id: "security", path: "/security", icon: ShieldAlert },
  { id: "credentials", path: "/credentials", icon: Server },
  { id: "apikeys", path: "/keys", icon: KeyRound },
]

export function getAppSurface(id: SurfaceId): AppSurface {
  const surface = APP_SURFACES.find((s) => s.id === id)
  if (!surface) throw new Error(`Unknown surface: ${id}`)
  return surface
}
