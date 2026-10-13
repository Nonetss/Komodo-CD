import { env } from "@komodo-cd/env/server"
import { logger } from "@komodo-cd/logger"
import { ORPCError } from "@orpc/server"

import {
  collectImages,
  type ImageScanQueue,
  imageScans,
} from "#lib/image-scans"
import { komodoService } from "#lib/komodo"
import { trivyService } from "#lib/trivy"

// La primera pasada espera a que el arranque termine; después, cada 5 min
const FIRST_SWEEP_DELAY_MS = 30_000
const SWEEP_INTERVAL_MS = 5 * 60_000
const HOUR_MS = 3_600_000

type ScanSchedulerOptions = {
  queue?: ImageScanQueue
  rescanIntervalHours?: number
}

/**
 * Pasada periódica que mantiene los escaneos al día sin que nadie los pida:
 * imágenes sin escanear, imágenes de stacks que Komodo desplegó por su cuenta
 * (auto update, su UI, procedures) y reescaneo de las que llevan más de
 * `TRIVY_RESCAN_INTERVAL_HOURS` sin intentarse. No guarda estado propio: todo
 * sale de Komodo y de la tabla `image_scan`, así que un reinicio no pierde
 * nada.
 */
export class ScanScheduler {
  private readonly queue: ImageScanQueue
  private readonly rescanIntervalHours: number
  private firstTimer: ReturnType<typeof setTimeout> | undefined
  private interval: ReturnType<typeof setInterval> | undefined
  private running = false

  constructor({
    queue = imageScans,
    rescanIntervalHours = env.TRIVY_RESCAN_INTERVAL_HOURS,
  }: ScanSchedulerOptions = {}) {
    this.queue = queue
    this.rescanIntervalHours = rescanIntervalHours
  }

  /** Arranca las pasadas; sin Trivy, o si ya están en marcha, no hace nada. */
  start() {
    if (!trivyService.isEnabled() || this.firstTimer || this.interval) return
    const tick = () => void this.sweep()
    this.firstTimer = setTimeout(tick, FIRST_SWEEP_DELAY_MS)
    this.interval = setInterval(tick, SWEEP_INTERVAL_MS)
    this.firstTimer.unref()
    this.interval.unref()
  }

  /** Para las pasadas futuras; la que esté en curso no se espera. */
  stop() {
    clearTimeout(this.firstTimer)
    clearInterval(this.interval)
    this.firstTimer = undefined
    this.interval = undefined
  }

  /** Una pasada. Nunca lanza: los fallos se registran y se reintenta en la siguiente. */
  async sweep() {
    // Una pasada lenta (Komodo tarda) no se solapa con la siguiente
    if (this.running) return
    this.running = true
    try {
      await this.run()
    } catch (err) {
      logger.warn({ err }, "⚠️ Error en la pasada de escaneos automáticos")
    } finally {
      this.running = false
    }
  }

  private async run() {
    let stacks: Awaited<ReturnType<typeof komodoService.listAllStacks>>
    try {
      stacks = await komodoService.listAllStacks()
    } catch (err) {
      // Sin conexión a Komodo configurada es un estado normal, no un fallo
      if (err instanceof ORPCError && err.code === "SERVICE_UNAVAILABLE") {
        logger.debug(
          "Escaneos automáticos omitidos: Komodo no está configurado"
        )
        return
      }
      throw err
    }
    const images = collectImages(stacks)
    const inUse = [...images.keys()]

    const missing = await this.queue.enqueueMissing(inUse)

    // Un fallo leyendo los Updates no impide el reescaneo periódico
    let deployed: string[] = []
    try {
      deployed = await this.queue.enqueueDeployed(
        await this.deployedImages(stacks)
      )
    } catch (err) {
      logger.warn({ err }, "⚠️ Error leyendo los deploys de Komodo")
    }

    let stale: string[] = []
    if (this.rescanIntervalHours > 0) {
      const olderThan = new Date(
        Date.now() - this.rescanIntervalHours * HOUR_MS
      )
      stale = await this.queue.enqueueStale(inUse, olderThan)
    }

    if (missing.length + deployed.length + stale.length > 0) {
      logger.info(
        {
          missing: missing.length,
          deployed: deployed.length,
          stale: stale.length,
        },
        "🔁 Escaneos automáticos encolados"
      )
    }
  }

  /**
   * Hora del último deploy de cada imagen según los Updates de Komodo. Si
   * varios stacks usan la imagen, cuenta el deploy más reciente; los stacks
   * que ya no existen se ignoran.
   */
  private async deployedImages(
    stacks: Awaited<ReturnType<typeof komodoService.listAllStacks>>
  ) {
    const deploys = await komodoService.listRecentStackDeploys()
    const lastDeploy = new Map<string, Date>()
    for (const { stackId, startedAt } of deploys) {
      const previous = lastDeploy.get(stackId)
      if (!previous || startedAt > previous) lastDeploy.set(stackId, startedAt)
    }

    const deployedAt = new Map<string, Date>()
    for (const stack of stacks) {
      const startedAt = lastDeploy.get(stack.id)
      if (!startedAt) continue
      for (const image of collectImages([stack]).keys()) {
        const previous = deployedAt.get(image)
        if (!previous || startedAt > previous) deployedAt.set(image, startedAt)
      }
    }
    return deployedAt
  }
}

// `bun --hot` vuelve a evaluar el módulo; el planificador vive en globalThis
// para no duplicar los temporizadores entre recargas.
declare global {
  var __scanScheduler: ScanScheduler | undefined
}

globalThis.__scanScheduler ??= new ScanScheduler()

export const scanScheduler = globalThis.__scanScheduler
