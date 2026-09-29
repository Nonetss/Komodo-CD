import { QueryClientProvider } from "@tanstack/react-query"
import type { ComponentType, ReactNode } from "react"
import { getQueryClient } from "@/lib/query-client"

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

/** Envuelve una isla de Astro (`client:only`) con el QueryProvider compartido. */
export function withQueryProvider<P extends object>(
  Component: ComponentType<P>
) {
  const Wrapped = (props: P) => (
    <QueryProvider>
      <Component {...props} />
    </QueryProvider>
  )
  Wrapped.displayName = `withQueryProvider(${Component.displayName ?? Component.name})`
  return Wrapped
}
