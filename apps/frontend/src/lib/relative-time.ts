/**
 * "hace 3 minutos" / "3 minutes ago" en el idioma dado; a partir de una semana,
 * la fecha.
 */
export function relativeTime(date: Date, lang: string) {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" })
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, "second")
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), "day")
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(date)
}
