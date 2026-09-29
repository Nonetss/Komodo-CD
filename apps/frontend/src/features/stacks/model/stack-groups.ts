import { stateTone } from "@/features/stacks/components/stack-state"
import type { Stack, StackState } from "@/lib/api-types"

/** Filtros de la lista de stacks */
export type StackGroup = "all" | "running" | "stopped" | "problems"

const STOPPED: StackState[] = ["stopped", "down", "paused", "created"]

export const hasProblem = (s: Stack) =>
  stateTone(s.info.state) === "danger" ||
  s.info.state === "unknown" ||
  s.info.project_missing ||
  s.info.missing_files.length > 0

export const inGroup = (s: Stack, group: StackGroup) => {
  if (group === "all") return true
  if (group === "problems") return hasProblem(s)
  if (group === "stopped") return STOPPED.includes(s.info.state)
  return s.info.state === "running" || s.info.state === "deploying"
}

/** Alguna imagen tiene update, o el commit desplegado no es el último */
export const hasUpdate = (s: Stack) =>
  s.info.services.some((svc) => svc.update_available) ||
  (!!s.info.latest_hash &&
    !!s.info.deployed_hash &&
    s.info.latest_hash !== s.info.deployed_hash)
