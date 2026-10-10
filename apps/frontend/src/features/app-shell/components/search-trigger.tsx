import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

/** `⌘K` en plataformas de Apple, `Ctrl K` en el resto. */
function shortcutLabel() {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform
  return /mac|iphone|ipad/i.test(platform) ? "⌘K" : "Ctrl K"
}

export interface SearchTriggerProps {
  /** `field` parece un campo de búsqueda (escritorio); `icon`, un botón. */
  variant: "field" | "icon"
  onOpen: () => void
  className?: string
}

/** Abre el buscador de la barra superior (`SurfaceSearchDialog`). */
export function SearchTrigger({
  variant,
  onOpen,
  className,
}: SearchTriggerProps) {
  const { t } = useTranslation()
  // La plataforma solo se sabe en el navegador: el atajo aparece al hidratar
  const hydrated = useHydrated()

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onOpen}
        aria-label={t("search.open")}
        title={t("search.open")}
        className={className}
      >
        <Search />
      </Button>
    )
  }

  return (
    <button
      type="button"
      aria-label={t("search.open")}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={onOpen}
      className={cn(
        "border-rule rule-b text-muted-foreground hover:text-foreground focus-visible:border-signal inline-flex h-9 w-48 shrink-0 cursor-pointer items-center gap-2 transition-colors outline-none xl:w-60",
        className
      )}
    >
      <Search aria-hidden className="size-3.5 shrink-0" />
      <span className="flex-1 text-left">{t("search.trigger")}</span>
      {hydrated ? <Kbd>{shortcutLabel()}</Kbd> : null}
    </button>
  )
}
