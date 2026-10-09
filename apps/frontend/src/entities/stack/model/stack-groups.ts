import { stateTone } from "@/entities/stack/components/stack-state"
import type { Stack, StackState } from "@/lib/api-types"

/** Filtros de la lista de stacks */
export type StackGroup = "all" | "running" | "stopped" | "problems"

const STOPPED: StackState[] = ["stopped", "down", "paused", "created"]

/**
 * Por qué un stack pide atención, de lo más grave a lo menos: el proyecto no
 * está en el host, faltan ficheros, un estado de peligro (`unhealthy`, `dead`,
 * `removing`) o Komodo no sabe el estado.
 */
export type ProblemKind =
  | "project-missing"
  | "missing-files"
  | "danger"
  | "unknown"

export const problemKind = (s: Stack): ProblemKind | null => {
  if (s.info.project_missing) return "project-missing"
  if (s.info.missing_files.length > 0) return "missing-files"
  if (stateTone(s.info.state) === "danger") return "danger"
  if (s.info.state === "unknown") return "unknown"
  return null
}

export const hasProblem = (s: Stack) => problemKind(s) !== null

export const isRunning = (s: Stack) =>
  s.info.state === "running" || s.info.state === "deploying"

export const inGroup = (s: Stack, group: StackGroup) => {
  if (group === "all") return true
  if (group === "problems") return hasProblem(s)
  if (group === "stopped") return STOPPED.includes(s.info.state)
  return isRunning(s)
}

/** Alguna imagen tiene update, o el commit desplegado no es el último */
export const hasUpdate = (s: Stack) =>
  s.info.services.some((svc) => svc.update_available) || commitChanged(s)

/** Hay un commit más nuevo que el desplegado */
export const commitChanged = (s: Stack) =>
  !!s.info.latest_hash &&
  !!s.info.deployed_hash &&
  s.info.latest_hash !== s.info.deployed_hash

/** Secciones del resumen, por urgencia: cada stack cae en una sola */
export type Urgency = "attention" | "updates" | "running" | "stopped"

export const urgency = (s: Stack): Urgency => {
  if (hasProblem(s)) return "attention"
  if (hasUpdate(s)) return "updates"
  if (isRunning(s)) return "running"
  return "stopped"
}
