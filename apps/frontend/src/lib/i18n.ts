import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en"
import es from "@/locales/es"

const savedLang =
  typeof localStorage !== "undefined"
    ? (localStorage.getItem("lang") ?? "es")
    : "es"

i18next.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: "es",
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  interpolation: { escapeValue: false },
})

export default i18next
