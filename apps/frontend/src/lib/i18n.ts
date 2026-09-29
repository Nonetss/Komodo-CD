import i18next, { type i18n as I18n } from "i18next"
import { initReactI18next } from "react-i18next"

import en from "@/locales/en"
import es from "@/locales/es"

export type Lang = "es" | "en"

export const DEFAULT_LANG: Lang = "es"

export const toLang = (value: string | undefined): Lang =>
  value === "en" ? "en" : DEFAULT_LANG

i18next.use(initReactI18next).init({
  lng: DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  interpolation: { escapeValue: false },
  initAsync: false,
})

// Una instancia por idioma, clonada de la base (comparte recursos). Así el
// SSR no cambia el idioma de un singleton compartido entre peticiones y el
// cliente hidrata con el mismo idioma con el que se renderizó.
const instances = new Map<Lang, I18n>()

export function getI18n(lang: Lang): I18n {
  let instance = instances.get(lang)
  if (!instance) {
    instance = i18next.cloneInstance({ lng: lang, initAsync: false })
    instances.set(lang, instance)
  }
  return instance
}

export default i18next
