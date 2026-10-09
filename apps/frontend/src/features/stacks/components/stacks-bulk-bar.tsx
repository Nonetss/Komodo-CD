import { X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { InlineConfirm } from "@/components/shared/feedback/inline-confirm"
import { Button } from "@/components/ui/button"
import {
  ACTION_I18N,
  ACTION_ICON,
  DEPLOY_ACTIONS,
} from "@/entities/deploy-action"
import type { DeployAction } from "@/lib/api-types"

/**
 * Barra de acciones sobre los stacks seleccionados. Elegir una acción pide
 * confirmación en la propia barra antes de lanzarla.
 */
export function StacksBulkBar({
  count,
  hidden,
  runningAction,
  disabled,
  onRun,
  onClear,
}: {
  count: number
  hidden: number
  runningAction: DeployAction | null
  disabled: boolean
  onRun: (action: DeployAction) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState<DeployAction | null>(null)
  const actionLabel = (a: DeployAction) =>
    t(`deploy.actions.${ACTION_I18N[a]}.label`)

  return (
    <div className="bg-popover text-popover-foreground border-rule @container sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center gap-x-3 gap-y-2 rule px-4 py-2.5 shadow-lg lg:bottom-3">
      {confirming ? (
        <InlineConfirm
          message={t("stacks.bulk.confirm", {
            action: actionLabel(confirming),
            count,
          })}
          confirmLabel={t("stacks.bulk.run")}
          onConfirm={() => {
            setConfirming(null)
            onRun(confirming)
          }}
          onCancel={() => setConfirming(null)}
        />
      ) : (
        <>
          <Text
            as="p"
            className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 font-semibold"
          >
            <span className="tabular-nums">
              {t("stacks.bulk.selected", { count })}
            </span>
            {hidden > 0 && (
              <Text as="span" variant="meta" tone="muted">
                {t("stacks.bulk.hidden", { count: hidden })}
              </Text>
            )}
          </Text>
          <div className="flex shrink-0 items-center gap-1">
            {DEPLOY_ACTIONS.map((action) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                icon={ACTION_ICON[action]}
                loading={runningAction === action}
                disabled={disabled}
                onClick={() => setConfirming(action)}
                title={actionLabel(action)}
                aria-label={actionLabel(action)}
              >
                <span className="hidden @lg:inline">{actionLabel(action)}</span>
              </Button>
            ))}
            <span aria-hidden className="bg-border mx-1 h-4 w-px" />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onClear}
              disabled={runningAction !== null}
              title={t("stacks.bulk.clear")}
              aria-label={t("stacks.bulk.clear")}
            >
              <X />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
