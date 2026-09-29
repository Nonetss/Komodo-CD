import type { AstroCookies } from "astro"

import { type Lang, toLang } from "@/lib/i18n"

/** Idioma de la petición: la cookie `lang` que fija el LanguageSwitcher. */
export const getLang = (cookies: AstroCookies): Lang =>
  toLang(cookies.get("lang")?.value)
