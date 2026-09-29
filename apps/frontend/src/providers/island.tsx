import type { ComponentType } from "react"
import { I18nextProvider } from "react-i18next"

import { getI18n, type Lang } from "@/lib/i18n"
import { QueryProvider } from "@/providers/query-provider"

export type IslandProps = {
  /** Idioma con el que se renderiza (SSR) e hidrata la isla */
  lang?: Lang
}

/**
 * Envuelve una isla de Astro (`client:load`) con i18n y el QueryClient
 * compartido. La isla se renderiza en SSR con el idioma de la cookie y se
 * hidrata con el mismo, sin desajustes.
 */
export function withIsland<P extends object>(Component: ComponentType<P>) {
  const Island = ({ lang = "es", ...props }: P & IslandProps) => (
    <I18nextProvider i18n={getI18n(lang)}>
      <QueryProvider>
        <Component {...(props as P)} />
      </QueryProvider>
    </I18nextProvider>
  )
  Island.displayName = `withIsland(${Component.displayName ?? Component.name})`
  return Island
}
