import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { withIsland } from "@/providers/island"

/** Versión sin envoltorio, para usar dentro de otra isla (hereda su idioma). */
export const LanguageSwitcherButton = () => {
  const { i18n } = useTranslation()
  const isEs = i18n.language.startsWith("es")

  const toggle = () => {
    const next = isEs ? "en" : "es"
    // biome-ignore lint/suspicious/noDocumentCookie: cookie simple que lee el SSR para el idioma
    document.cookie = `lang=${next};path=/;max-age=31536000`
    window.location.reload()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className="font-mono text-[11px] font-semibold"
      aria-label={isEs ? "Switch to English" : "Cambiar a Español"}
      title={isEs ? "Switch to English" : "Cambiar a Español"}
    >
      {isEs ? "EN" : "ES"}
    </Button>
  )
}

export const LanguageSwitcher = withIsland(LanguageSwitcherButton)
