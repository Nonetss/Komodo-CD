import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import type { DeployAction, DeployRun } from "@/lib/api-types"
import { client, orpc } from "@/lib/orpc"

const MAX_RETRY_DELAY_MS = 30_000

const retryDelay = (attempt: number) =>
  Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS)

/** Espera `ms`, o menos si se aborta antes. */
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true }
    )
  })

/**
 * Sigue en vivo los deploys de cualquier origen (esta pestaña, otra, el CI)
 * con `v0.deploy.watch`. Devuelve la acción en curso de cada stack y refresca
 * el historial y los stacks cuando termina un deploy.
 *
 * El backend no repite eventos: si el stream se corta, reconecta con espera
 * creciente y, al volver, refresca las dos queries por lo que se haya perdido.
 */
export const useDeployEvents = () => {
  const queryClient = useQueryClient()
  // Por id de ejecución: un mismo stack puede tener más de una en curso
  const [runs, setRuns] = useState<Record<string, DeployRun>>({})

  useEffect(() => {
    // Solo en el navegador: los efectos no corren en SSR
    const controller = new AbortController()
    const { signal } = controller

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: orpc.v0.history.key() })
      queryClient.invalidateQueries({ queryKey: orpc.v0.stacks.key() })
    }

    const listen = async () => {
      let attempt = 0
      let subscribedBefore = false

      while (!signal.aborted) {
        try {
          const events = await client.v0.deploy.watch(undefined, { signal })
          for await (const event of events) {
            if (event.type === "subscribed") {
              attempt = 0
              setRuns(Object.fromEntries(event.running.map((r) => [r.id, r])))
              if (subscribedBefore) refresh()
              subscribedBefore = true
            } else if (event.type === "started") {
              setRuns((prev) => ({ ...prev, [event.run.id]: event.run }))
            } else {
              setRuns((prev) => {
                const next = { ...prev }
                delete next[event.run.id]
                return next
              })
              refresh()
            }
          }
        } catch {
          // Stream cortado (backend reiniciado, red…): se reintenta abajo
        }
        if (signal.aborted) return

        // Sin conexión no se sabe qué sigue en curso; al volver llega el estado
        setRuns({})
        await wait(retryDelay(attempt++), signal)
      }
    }

    void listen()
    return () => controller.abort()
  }, [queryClient])

  return useMemo(() => {
    const byStack: Record<string, DeployAction> = {}
    for (const run of Object.values(runs)) {
      byStack[run.stack] = run.action as DeployAction
    }
    return byStack
  }, [runs])
}
