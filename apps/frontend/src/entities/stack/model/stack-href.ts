/** Ruta de la ficha de un stack (`/stacks/<nombre>`), con el nombre escapado */
export const stackHref = (name: string) => `/stacks/${encodeURIComponent(name)}`
