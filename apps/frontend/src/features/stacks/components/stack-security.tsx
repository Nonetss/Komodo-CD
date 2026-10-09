import { ArrowRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text, textVariants } from "@/components/shared/brand/typography"
import { SectionHeader } from "@/components/shared/layout/section-header"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageTable, useImages, useScan } from "@/entities/image-scan"
import type { Stack } from "@/lib/api-types"
import { getErrorMessage } from "@/lib/orpc"
import { cn } from "@/lib/utils"

/**
 * Sección de seguridad de la ficha: las imágenes del stack con sus recuentos
 * de Trivy, cada una desplegable con sus CVEs, igual que en `/security`. Sin
 * imágenes no se pinta.
 */
export function StackSecurity({ stack }: { stack: Stack }) {
  const { t } = useTranslation()
  const imagesQuery = useImages()
  const { scan, scanning } = useScan()
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  const images = useMemo(
    () =>
      (imagesQuery.data?.images ?? []).filter((i) =>
        i.stacks.includes(stack.name)
      ),
    [imagesQuery.data, stack.name]
  )
  const enabled = imagesQuery.data?.enabled ?? false

  if (imagesQuery.isSuccess && images.length === 0) return null

  const toggle = (image: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(image)) next.add(image)
      return next
    })

  let content: React.ReactNode
  if (imagesQuery.isError) {
    content = (
      <Text as="p" tone="destructive" className="py-3">
        {getErrorMessage(imagesQuery.error, t("security.errorLoad"))}
      </Text>
    )
  } else if (!imagesQuery.isSuccess) {
    content = (
      <div className="space-y-3 py-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  } else {
    content = (
      <>
        {enabled ? null : (
          <Text as="p" variant="meta" tone="muted" className="py-3">
            {t("security.disabledDescription")}
          </Text>
        )}
        <ImageTable
          images={images}
          open={open}
          onToggle={toggle}
          canScan={enabled}
          scanning={scanning}
          onScan={(image) => scan(image)}
          stack={stack.name}
        />
      </>
    )
  }

  return (
    <section aria-labelledby="stack-security" className="flex flex-col">
      <SectionHeader
        as="h3"
        id="stack-security"
        title={t("stacks.securityTitle")}
        aside={imagesQuery.isSuccess ? images.length : null}
        action={
          <a
            href="/security"
            className={cn(
              textVariants({ role: "label", tone: "muted" }),
              "hover:text-foreground inline-flex items-center gap-1.5"
            )}
          >
            {t("stacks.securityAll")}
            <ArrowRight aria-hidden className="size-3.5" />
          </a>
        }
      />
      {content}
    </section>
  )
}
