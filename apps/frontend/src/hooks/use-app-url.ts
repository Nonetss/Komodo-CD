import { PUBLIC_APP_URL } from "astro:env/client"

import { useHydrated } from "@/hooks/use-hydrated"

const FALLBACK = "https://komodo-cd.example.com"

/**
 * URL pública para los curl de ejemplo. En SSR y en el primer render usa
 * PUBLIC_APP_URL (o un placeholder) para que la hidratación coincida; tras
 * hidratar, si no hay PUBLIC_APP_URL, el origen real del navegador.
 */
export function useAppUrl() {
  const hydrated = useHydrated()
  const fromBuild = PUBLIC_APP_URL?.replace(/\/$/, "")
  if (fromBuild) return fromBuild
  return hydrated ? window.location.origin : FALLBACK
}
