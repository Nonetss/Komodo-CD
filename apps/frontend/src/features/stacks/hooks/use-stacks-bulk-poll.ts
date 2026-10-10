import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BULK_CONCURRENCY, runPool } from "@/entities/deploy-action"
import { getErrorMessage, orpc } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"

/**
 * Activa Poll for Updates en varios stacks (como mucho `BULK_CONCURRENCY` a
 * la vez) con un único toast al final, para que el Global Auto Update de
 * Komodo compruebe sus imágenes. Resuelve con los nombres actualizados; los
 * fallidos se nombran en el toast.
 */
export const useStacksBulkPoll = () => {
  const { t } = useTranslation()
  const pollForUpdates = useMutation(
    orpc.v0.stacks.pollForUpdates.mutationOptions()
  )
  const [enabling, setEnabling] = useState(false)

  const run = async (names: string[]) => {
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    setEnabling(true)
    const results = await runPool(sorted, BULK_CONCURRENCY, (stack) =>
      pollForUpdates.mutateAsync({ stack, enabled: true })
    )
    setEnabling(false)

    const failed = results.filter((r) => !r.ok)
    if (failed.length === 0) {
      notifySuccess(t("stacks.bulk.polling", { count: sorted.length }))
    } else {
      notifyError(
        t("stacks.bulk.pollFailed", {
          count: failed.length,
          total: sorted.length,
        }),
        failed
          .map(
            (r) =>
              `${r.item}: ${getErrorMessage(r.error, t("stacks.errorPoll"))}`
          )
          .join(" · ")
      )
    }
    return results.filter((r) => r.ok).map((r) => r.item)
  }

  return { run, enabling }
}
