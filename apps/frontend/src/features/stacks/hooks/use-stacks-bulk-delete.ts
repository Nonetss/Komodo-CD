import { navigate } from "astro:transitions/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BULK_CONCURRENCY, runPool } from "@/entities/deploy-action"
import { stacksListKey } from "@/entities/stack"
import { getErrorMessage, orpc } from "@/lib/orpc"
import { notifyError, notifySuccess } from "@/lib/toast"

/**
 * Borra varios stacks en Komodo (como mucho `BULK_CONCURRENCY` a la vez) con
 * un único toast al final. Resuelve con los nombres borrados; los fallidos se
 * nombran en el toast. Si la ficha abierta era de un stack borrado, vuelve a
 * `/stacks` antes de refrescar la lista, como el borrado suelto.
 */
export const useStacksBulkDelete = (openName: string | null) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const remove = useMutation(orpc.v0.stacks.remove.mutationOptions())
  const [deleting, setDeleting] = useState(false)

  const run = async (names: string[]) => {
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    setDeleting(true)
    const results = await runPool(sorted, BULK_CONCURRENCY, (stack) =>
      remove.mutateAsync({ stack })
    )
    setDeleting(false)

    const deleted = results.filter((r) => r.ok).map((r) => r.item)
    if (openName && deleted.includes(openName)) await navigate("/stacks")
    await queryClient.invalidateQueries({ queryKey: stacksListKey })

    const failed = results.filter((r) => !r.ok)
    if (failed.length === 0) {
      notifySuccess(t("stacks.bulk.deleted", { count: sorted.length }))
    } else {
      notifyError(
        t("stacks.bulk.deleteFailed", {
          count: failed.length,
          total: sorted.length,
        }),
        failed
          .map(
            (r) =>
              `${r.item}: ${getErrorMessage(r.error, t("stacks.errorDelete"))}`
          )
          .join(" · ")
      )
    }
    return deleted
  }

  return { run, deleting }
}
