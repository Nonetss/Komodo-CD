import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { isScanPending } from "@/entities/image-scan/model/images"
import { useHydratedQuery } from "@/hooks/use-hydrated-query"
import { client, orpc } from "@/lib/orpc"
import { toastMutation } from "@/lib/toast"

// Lo que tarda en verse un escaneo que acaba de terminar
const POLL_MS = 3000

/** Imágenes de Komodo con su escaneo; se refresca sola mientras hay escaneos. */
export const useImages = () =>
  useHydratedQuery(
    orpc.v0.security.list.queryOptions({
      refetchInterval: (query) =>
        query.state.data?.images.some(isScanPending) ? POLL_MS : false,
    })
  )

/** Vulnerabilidades de una imagen; solo se piden con la fila abierta. */
export const useImageDetail = (image: string, enabled: boolean) =>
  useHydratedQuery(
    orpc.v0.security.get.queryOptions({ input: { image }, enabled })
  )

/**
 * Encola escaneos (`undefined` = todas las imágenes) y avisa con un toast.
 * `scanning` dice qué petición está en vuelo: `"all"` o la imagen.
 */
export function useScan() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [scanning, setScanning] = useState<string | null>(null)

  const scan = async (image?: string) => {
    setScanning(image ?? "all")
    await toastMutation(
      () => client.v0.security.scan(image ? { images: [image] } : {}),
      {
        success: ({ queued }) => ({
          title: t("security.toast.queued", { count: queued.length }),
          description:
            queued.length === 0 ? t("security.toast.alreadyQueued") : undefined,
        }),
        error: t("security.toast.error"),
      }
    )
    setScanning(null)
    await queryClient.invalidateQueries({
      queryKey: orpc.v0.security.list.key(),
    })
  }

  return { scan, scanning }
}
