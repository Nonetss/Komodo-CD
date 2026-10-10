import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { CommandFooter } from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

/**
 * Leyenda de teclas bajo los resultados del buscador. Se oculta en pantallas
 * pequeñas, donde la paleta se usa con el dedo.
 */
export function SurfaceSearchFooter() {
  const { t } = useTranslation()
  const hints = [
    { keys: ["↑", "↓"], label: t("search.keys.navigate") },
    { keys: ["↵"], label: t("search.keys.open") },
    { keys: ["esc"], label: t("search.keys.close") },
  ]

  return (
    <CommandFooter aria-hidden className="hidden sm:flex">
      {hints.map((hint) => (
        <span key={hint.label} className="inline-flex items-center gap-1.5">
          <KbdGroup>
            {hint.keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
          <Text variant="meta-sm" tone="muted">
            {hint.label}
          </Text>
        </span>
      ))}
    </CommandFooter>
  )
}
