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

/** La palabra se tiñe con el punto salvo en los estados neutros (parado…). */
const inked = (state: StackState) => stateTone(state) !== "muted"

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
 * Punto + palabra en micro-caps, teñida con su tono. Los estados neutros
 * (parado, down, desconocido) se quedan en gris para que destaque lo vivo.
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
      ink={inked(state)}
      className={className}
    >
      {t(`stacks.states.${state}`, { defaultValue: state })}
    </StatusTag>
  )
}
