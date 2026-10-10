/** Minúsculas y sin tildes, para buscar sin distinguir acentos. */
export function foldText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}
