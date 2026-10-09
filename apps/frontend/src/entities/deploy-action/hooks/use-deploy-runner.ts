import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useDeployEvents } from "@/entities/deploy-action/hooks/use-deploy-events"
import { useDeployTrigger } from "@/entities/deploy-action/hooks/use-deploy-trigger"
import { ACTION_I18N } from "@/entities/deploy-action/model/deploy-actions"
import {
  BULK_CONCURRENCY,
  runPool,
} from "@/entities/deploy-action/model/run-pool"
import type { DeployAction } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError, notifySuccess, toastMutation } from "@/lib/toast"

/**
 * Lanza acciones sobre stacks desde una página (Resumen o Stacks) con las
 * mismas reglas en las dos: un toast por acción suelta, uno de resumen por
 * lote (como mucho `BULK_CONCURRENCY` llamadas a la vez) y, para saber si un
 * stack está ocupado, lo lanzado aquí o lo que diga el stream de deploys.
 */
export const useDeployRunner = () => {
  const { t } = useTranslation()
  const deployTrigger = useDeployTrigger()
  // Deploys en curso lanzados desde cualquier sitio (otra pestaña, el CI…)
  const liveRunning = useDeployEvents()
  const [pending, setPending] = useState<Record<string, DeployAction | null>>(
    {}
  )
  const [bulkAction, setBulkAction] = useState<DeployAction | null>(null)

  const actionLabel = (action: DeployAction) =>
    t(`deploy.actions.${ACTION_I18N[action]}.label`)

  // En modo `silent` no hay toast: el error se relanza para quien llama
  const runAction = async (
    stack: string,
    action: DeployAction,
    { silent = false } = {}
  ) => {
    const label = actionLabel(action)
    const trigger = () => deployTrigger.mutateAsync({ stack, action })
    setPending((p) => ({ ...p, [stack]: action }))
    try {
      if (silent) return await trigger()
      return await toastMutation(trigger, {
        success: (res) => ({
          title: t("stacks.actionDone", { action: label, stack }),
          description: res.message,
        }),
        error: `${label} · ${stack}`,
        errorFallback: t("stacks.errorAction"),
      })
    } finally {
      setPending((p) => ({ ...p, [stack]: null }))
    }
  }

  /** Una acción sobre un stack, con su toast. Nunca lanza. */
  const run = (stack: string, action: DeployAction) => runAction(stack, action)

  /**
   * La misma acción sobre varios stacks y un único toast al final. Resuelve
   * con los nombres que han ido bien; los fallidos se nombran en el toast.
   */
  const runBulk = async (names: string[], action: DeployAction) => {
    const label = actionLabel(action)
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    setBulkAction(action)
    const results = await runPool(sorted, BULK_CONCURRENCY, (name) =>
      runAction(name, action, { silent: true })
    )
    setBulkAction(null)

    const failed = results.filter((r) => !r.ok)
    if (failed.length === 0) {
      notifySuccess(
        t("stacks.bulk.done", { action: label, count: sorted.length })
      )
    } else {
      notifyError(
        t("stacks.bulk.failed", {
          action: label,
          count: failed.length,
          total: sorted.length,
        }),
        failed
          .map(
            (r) =>
              `${r.item}: ${getErrorMessage(r.error, t("stacks.errorAction"))}`
          )
          .join(" · ")
      )
    }
    return results.filter((r) => r.ok).map((r) => r.item)
  }

  // Lo lanzado desde esta página manda; si no, lo que diga el stream
  const runningAction = (name: string): DeployAction | null =>
    pending[name] ?? liveRunning[name] ?? null

  return {
    run,
    runBulk,
    runningAction,
    /** Acción del lote en curso, o `null` si no hay ninguno */
    bulkAction,
    actionLabel,
  }
}
