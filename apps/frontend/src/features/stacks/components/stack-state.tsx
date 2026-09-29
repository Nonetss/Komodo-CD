import { useTranslation } from "react-i18next"

import {
  StatusDot,
  StatusTag,
  type StatusTone,
} from "@/components/shared/data-display/status-dot"
import type { StackState } from "@/lib/api-types"

const STATE_TONE: Record<StackState, StatusTone> = {
  running: "success",
  deploying: "info",
  restarting: "warning",
  paused: "warning",
  created: "warning",
  unhealthy: "danger",
  dead: "danger",
  removing: "danger",
  stopped: "muted",
  down: "muted",
  unknown: "muted",
}

const PULSING: StackState[] = ["deploying", "restarting"]

export const stateTone = (state: StackState): StatusTone =>
  STATE_TONE[state] ?? "muted"

/** El estado pide atención: la palabra se tiñe además del punto. */
const needsAttention = (state: StackState) =>
  ["info", "warning", "danger"].includes(stateTone(state))

export function StackStateDot({
  state,
  className,
}: {
  state: StackState
  className?: string
}) {
  return (
    <StatusDot
      tone={stateTone(state)}
      pulse={PULSING.includes(state)}
      className={className}
    />
  )
}

/**
 * Punto + palabra en micro-caps. "Running" se queda en gris: 40 filas en
 * verde convertirían la lista en ruido; solo se tiñe lo que pide atención.
 */
export function StackStateTag({
  state,
  className,
}: {
  state: StackState
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <StatusTag
      tone={stateTone(state)}
      pulse={PULSING.includes(state)}
      ink={needsAttention(state)}
      className={className}
    >
      {t(`stacks.states.${state}`, { defaultValue: state })}
    </StatusTag>
  )
}
