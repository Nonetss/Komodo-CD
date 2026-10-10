/**
 * Si `href` es la página de `path`: la misma ruta o, salvo la raíz (resumen,
 * que como prefijo lo sería siempre), un prefijo suyo.
 */
export const isActivePath = (path: string, href: string) =>
  href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)
