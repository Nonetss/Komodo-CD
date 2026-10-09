import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

/** Cambia entre español e inglés. Va dentro de una isla (hereda su idioma). */
export const LanguageSwitcherButton = () => {
  const { t, i18n } = useTranslation()
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
      className="text-meta-sm font-mono font-bold"
      aria-label={t("common.switchLanguage")}
      title={t("common.switchLanguage")}
    >
      {isEs ? "EN" : "ES"}
    </Button>
  )
}
