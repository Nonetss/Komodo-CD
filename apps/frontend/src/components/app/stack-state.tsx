import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { StackState } from "@/lib/api-types"
import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "danger" | "info" | "neutral"

const STATE_TONE: Record<StackState, Tone> = {
  running: "success",
  deploying: "info",
  restarting: "warning",
  paused: "warning",
  created: "warning",
  unhealthy: "danger",
  dead: "danger",
  removing: "danger",
  stopped: "neutral",
  down: "neutral",
  unknown: "neutral",
}

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground/40",
}

const BADGE = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "primary",
  neutral: "outline",
} as const

const PULSING: StackState[] = ["deploying", "restarting"]

export const stateTone = (state: StackState): Tone =>
  STATE_TONE[state] ?? "neutral"

export function StackStateDot({
  state,
  className,
}: {
  state: StackState
  className?: string
}) {
  const tone = stateTone(state)
  return (
    <span className={cn("relative flex size-2 shrink-0", className)}>
      {(PULSING.includes(state) || state === "running") && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-60",
            DOT[tone],
            PULSING.includes(state) ? "animate-ping" : "hidden"
          )}
        />
      )}
      <span className={cn("relative size-2 rounded-full", DOT[tone])} />
    </span>
  )
}

export function StackStateBadge({ state }: { state: StackState }) {
  const { t } = useTranslation()
  return (
    <Badge variant={BADGE[stateTone(state)]}>
      <StackStateDot state={state} className="size-1.5 [&>span]:size-1.5" />
      {t(`stacks.states.${state}`, { defaultValue: state })}
    </Badge>
  )
}
