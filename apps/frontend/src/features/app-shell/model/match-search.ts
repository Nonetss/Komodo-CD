import { foldText } from "@/lib/fold-text"

/**
 * Filtro del buscador (`filter` de cmdk): cada palabra de la consulta tiene
 * que estar dentro de alguna de las palabras clave del resultado (nombre,
 * descripción, grupo), sin distinguir tildes, así "stacks git" encuentra
 * `gitea`. La puntuación es 0 o 1 para que cmdk respete el orden en que se
 * pintan los resultados.
 */
export function matchSearch(
  _value: string,
  search: string,
  keywords?: string[]
) {
  const words = foldText(search).split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  const folded = (keywords ?? []).map(foldText)
  return words.every((word) => folded.some((keyword) => keyword.includes(word)))
    ? 1
    : 0
}
