import { Trash2, X } from "lucide-react"
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

// Lo que se confirma en la barra: una acción de deploy o borrar los stacks
type BulkChoice = DeployAction | "delete"

/**
 * Barra de acciones sobre los stacks seleccionados, flotando abajo en el
 * centro de la pantalla (en móvil, sobre la navegación). Elegir una acción, o
 * borrar, pide confirmación en la propia barra antes de lanzarla.
 */
export function StacksBulkBar({
  count,
  hidden,
  runningAction,
  deleting,
  disabled,
  onRun,
  onDelete,
  onClear,
}: {
  count: number
  hidden: number
  runningAction: DeployAction | null
  deleting: boolean
  disabled: boolean
  onRun: (action: DeployAction) => void
  onDelete: () => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState<BulkChoice | null>(null)
  const actionLabel = (a: DeployAction) =>
    t(`deploy.actions.${ACTION_I18N[a]}.label`)

  return (
    <div className="bg-popover text-popover-foreground fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl flex-wrap items-center gap-x-8 gap-y-3 border px-5 py-3.5 shadow-lg lg:bottom-6">
      {confirming === "delete" ? (
        <InlineConfirm
          message={t("stacks.bulk.confirmDelete", { count })}
          confirmLabel={t("common.delete")}
          destructive
          onConfirm={() => {
            setConfirming(null)
            onDelete()
          }}
          onCancel={() => setConfirming(null)}
        />
      ) : confirming ? (
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
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="icon-sm"
              variant="outline"
              icon={Trash2}
              loading={deleting}
              disabled={disabled}
              onClick={() => setConfirming("delete")}
              title={t("stacks.deleteHint")}
              aria-label={t("common.delete")}
            />
            {DEPLOY_ACTIONS.map((action) => {
              const main = action === "pull-redeploy"
              // Solo la acción principal lleva texto; el resto, icono y tooltip
              return (
                <Button
                  key={action}
                  size={main ? "sm" : "icon-sm"}
                  variant={main ? "signal" : "outline"}
                  icon={ACTION_ICON[action]}
                  loading={runningAction === action}
                  disabled={disabled}
                  onClick={() => setConfirming(action)}
                  title={main ? undefined : actionLabel(action)}
                  aria-label={actionLabel(action)}
                >
                  {main ? actionLabel(action) : null}
                </Button>
              )
            })}
            <span aria-hidden className="bg-border mx-1 h-4 w-px" />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onClear}
              disabled={runningAction !== null || deleting}
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
