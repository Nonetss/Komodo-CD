import "@/lib/i18n"
import { useTranslation } from "react-i18next"

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const isEs = i18n.language.startsWith("es")

  const toggle = () => {
    const next = isEs ? "en" : "es"
    localStorage.setItem("lang", next)
    // biome-ignore lint/suspicious/noDocumentCookie: cookie simple que lee el SSR para el idioma
    document.cookie = `lang=${next};path=/;max-age=31536000`
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs font-medium transition-colors"
      aria-label={isEs ? "Switch to English" : "Cambiar a Español"}
    >
      {isEs ? "EN" : "ES"}
    </button>
  )
}
