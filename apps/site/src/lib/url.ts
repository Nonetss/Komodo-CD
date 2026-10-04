import { defaultLang, type Lang, languages } from "@/i18n/ui"

export const REPO_URL = "https://github.com/Nonetss/Komodo-CD"

const base = import.meta.env.BASE_URL.replace(/\/$/, "")

/** Antepone el base path de GitHub Pages a una ruta del sitio. */
export function href(path = ""): string {
  const clean = path.replace(/^\/+/, "")
  return `${base}/${clean}`
}

/** Ruta del sitio en el idioma dado (el inglés vive en la raíz). */
export function localized(lang: Lang, path = ""): string {
  const clean = path.replace(/^\/+/, "")
  return href(lang === defaultLang ? clean : `${lang}/${clean}`)
}

/** Lee el idioma de un pathname (con o sin base path). */
export function langFromPath(pathname: string): Lang {
  const [first] = pathname.slice(base.length).split("/").filter(Boolean)
  return first && first in languages && first !== defaultLang
    ? (first as Lang)
    : defaultLang
}

/** La misma página en otro idioma. */
export function switchLanguage(pathname: string, target: Lang): string {
  const rest = pathname.slice(base.length).split("/").filter(Boolean)
  if (rest[0] && rest[0] in languages) rest.shift()
  // La 404 existe una sola vez: sus enlaces de idioma van a la portada.
  if (rest[0]?.startsWith("404")) rest.length = 0
  const path = rest.length ? `${rest.join("/")}/` : ""
  return localized(target, path)
}
