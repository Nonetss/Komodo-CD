import type { ActorVia } from "@komodo-cd/auth/actor"
import { logger } from "@komodo-cd/logger"
import { MemoryPublisher } from "@orpc/experimental-publisher/memory"

/** Una ejecución de `deploy.trigger`, desde que empieza hasta que termina. */
export type DeployRun = {
  id: string
  stack: string
  action: string
  via: ActorVia
  actorName: string | null
  startedAt: string
}

export type DeployOutcome = {
  success: boolean
  message: string
}

export type DeployEvent =
  | { type: "started"; run: DeployRun }
  | ({ type: "finished"; run: DeployRun; finishedAt: string } & DeployOutcome)

/**
 * Bus en memoria de la actividad de deploys: lo que publica `deploy.trigger`
 * lo reciben los suscriptores de `deploy.watch`. Va todo en el proceso porque
 * el backend corre en una sola instancia; con varias habría que cambiar el
 * publisher por uno con transporte externo (Redis, por ejemplo).
 */
export class DeployEventBus {
  private readonly publisher = new MemoryPublisher<{
    "deploy-changed": DeployEvent
  }>()
  private readonly inFlight = new Map<string, DeployRun>()
  // Se aborta al apagar: corta todas las suscripciones a la vez
  private readonly shutdown = new AbortController()

  publishStarted(run: DeployRun) {
    this.inFlight.set(run.id, run)
    this.publish({ type: "started", run })
  }

  publishFinished(run: DeployRun, outcome: DeployOutcome) {
    if (!this.inFlight.delete(run.id)) return
    this.publish({
      type: "finished",
      run,
      ...outcome,
      finishedAt: new Date().toISOString(),
    })
  }

  /** Saca la ejecución sin avisar; no hace nada si ya terminó. */
  discard(runId: string) {
    this.inFlight.delete(runId)
  }

  /** Deploys en curso ahora mismo. */
  running() {
    return [...this.inFlight.values()]
  }

  /**
   * Cambios publicados desde ahora (nunca los anteriores). La suscripción se
   * registra al llamar, no al empezar a iterar, para que quien lea después
   * `running()` no pierda nada entre medias. Termina sin error cuando se
   * aborta `signal` o se cierra el bus.
   */
  subscribe(signal?: AbortSignal): AsyncGenerator<DeployEvent, void> {
    const combined = signal
      ? AbortSignal.any([signal, this.shutdown.signal])
      : this.shutdown.signal
    // Ya abortado (bus cerrado o petición cortada): no hay nada que esperar
    if (combined.aborted) return (async function* () {})()

    const events = this.publisher.subscribe("deploy-changed", {
      signal: combined,
    })

    return (async function* () {
      try {
        yield* events
      } catch (err) {
        if (combined.aborted) return
        throw err
      }
    })()
  }

  /** Cierra todas las suscripciones abiertas y las que lleguen después. */
  close() {
    this.shutdown.abort()
  }

  private publish(event: DeployEvent) {
    // En memoria no falla, pero un deploy nunca puede romperse por avisar
    this.publisher.publish("deploy-changed", event).catch((err) => {
      logger.error({ err }, "❌ Error publicando el evento de deploy")
    })
  }
}

// `bun --hot` vuelve a evaluar el módulo; el bus vive en globalThis para que
// los suscriptores abiertos y los deploys nuevos sigan usando el mismo.
declare global {
  var __deployEvents: DeployEventBus | undefined
}

globalThis.__deployEvents ??= new DeployEventBus()

export const deployEvents = globalThis.__deployEvents
