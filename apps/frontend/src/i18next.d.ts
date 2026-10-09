import "i18next"

import type es from "@/locales/es"

// Claves de `t()` y `<Trans>` tipadas con el diccionario español
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: { translation: typeof es }
  }
}
