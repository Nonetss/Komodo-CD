import { db } from "@komodo-cd/db"
import { type ImageScanErrorKind, imageScanTable } from "@komodo-cd/db/schema"
import { logger } from "@komodo-cd/logger"
import { eq, inArray } from "drizzle-orm"
import type { Types } from "komodo_client"

import { komodoService } from "#lib/komodo"
import { parseTrivyReport, TrivyScanError, trivyService } from "#lib/trivy"

// Escaneos a la vez: cada uno descarga capas del registry y ocupa al servidor
const SCAN_CONCURRENCY = 2

type StackLike = Pick<Types.StackListItem, "name" | "template"> & {
  info: { services: Pick<Types.StackServiceWithUpdate, "image">[] }
}

/**
 * Imágenes de los stacks (sin plantillas ni servicios sin imagen) con los
 * stacks que usan cada una, ordenados por nombre.
 */
export function collectImages(stacks: StackLike[]) {
  const byImage = new Map<string, Set<string>>()
  for (const stack of stacks) {
    if (stack.template) continue
    for (const { image } of stack.info.services ?? []) {
      if (!image) continue
      const users = byImage.get(image) ?? new Set<string>()
      users.add(stack.name)
      byImage.set(image, users)
    }
  }
  return new Map(
    [...byImage].map(([image, users]) => [image, [...users].sort()])
  )
}

/**
 * Cola en memoria de escaneos de Trivy. El estado que importa vive en la
 * tabla `image_scan`: si el proceso se reinicia con imágenes en cola o a
 * medias, `enqueueMissing` las vuelve a encolar al listar.
 */
export class ImageScanQueue {
  private readonly pending: string[] = []
  // Encoladas (aún sin empezar) y en curso, para no repetir ninguna
  private readonly queued = new Set<string>()
  private readonly running = new Map<string, AbortController>()
  private idleWaiters: (() => void)[] = []

  /** En cola o escaneándose ahora mismo en este proceso. */
  isTracked(image: string) {
    return this.queued.has(image) || this.running.has(image)
  }

  /**
   * Encola las imágenes que no estén ya en cola ni en curso y devuelve esas.
   * Marca su fila como `queued` sin borrar el resultado anterior.
   */
  async enqueue(images: string[]) {
    if (!trivyService.isEnabled()) return []
    const fresh = [...new Set(images)].filter((i) => i && !this.isTracked(i))
    if (fresh.length === 0) return []
    // Antes de esperar a la base de datos, para que dos llamadas seguidas no
    // encolen la misma imagen
    for (const image of fresh) this.queued.add(image)

    const now = new Date()
    try {
      await db
        .insert(imageScanTable)
        .values(
          fresh.map((image) => ({
            image,
            status: "queued" as const,
            requestedAt: now,
          }))
        )
        .onConflictDoUpdate({
          target: imageScanTable.image,
          set: { status: "queued", requestedAt: now },
        })
    } catch (err) {
      for (const image of fresh) this.queued.delete(image)
      throw err
    }

    this.pending.push(...fresh)
    this.pump()
    return fresh
  }

  /**
   * Encola las imágenes sin información: sin fila, o con una fila `queued` o
   * `scanning` que ningún escaneo de este proceso está atendiendo.
   */
  async enqueueMissing(images: string[]) {
    if (!trivyService.isEnabled() || images.length === 0) return []
    const rows = await db
      .select({ image: imageScanTable.image, status: imageScanTable.status })
      .from(imageScanTable)
      .where(inArray(imageScanTable.image, images))
    const status = new Map(rows.map((r) => [r.image, r.status]))
    const missing = images.filter((image) => {
      const s = status.get(image)
      if (s === undefined) return true
      return (s === "queued" || s === "scanning") && !this.isTracked(image)
    })
    return this.enqueue(missing)
  }

  /**
   * Encola las imágenes de un stack (tras un deploy). No espera a Komodo de
   * cara a quien llama y nunca lanza: un fallo aquí solo se registra.
   */
  async enqueueStack(stack: string) {
    if (!trivyService.isEnabled()) return
    try {
      const stacks = await komodoService.listAllStacks()
      const images = collectImages(stacks.filter((s) => s.name === stack))
      await this.enqueue([...images.keys()])
    } catch (err) {
      logger.error({ err, stack }, "❌ Error encolando el escaneo del stack")
    }
  }

  /** Resuelve cuando no queda nada en cola ni en curso. */
  idle() {
    if (this.pending.length === 0 && this.running.size === 0) {
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => this.idleWaiters.push(resolve))
  }

  /**
   * Corta los escaneos en curso y vacía la cola (al apagar). Sus filas se
   * quedan `queued`/`scanning` y `enqueueMissing` las recoge al volver.
   */
  close() {
    this.pending.length = 0
    this.queued.clear()
    for (const controller of this.running.values()) controller.abort()
  }

  private pump() {
    while (this.running.size < SCAN_CONCURRENCY && this.pending.length > 0) {
      const image = this.pending.shift() as string
      this.queued.delete(image)
      const controller = new AbortController()
      this.running.set(image, controller)
      void this.scan(image, controller.signal).finally(() => {
        this.running.delete(image)
        this.pump()
      })
    }
    if (this.pending.length === 0 && this.running.size === 0) {
      const waiters = this.idleWaiters
      this.idleWaiters = []
      for (const resolve of waiters) resolve()
    }
  }

  private async scan(image: string, signal: AbortSignal) {
    try {
      await db
        .update(imageScanTable)
        .set({ status: "scanning" })
        .where(eq(imageScanTable.image, image))
      // Cerrada la cola mientras se marcaba: ni se empieza
      if (signal.aborted) return
      logger.info(`🔍 Escaneando imagen: ${image}`)

      const result = parseTrivyReport(await trivyService.run(image, { signal }))
      const now = new Date()
      await db
        .update(imageScanTable)
        .set({
          status: "done",
          digest: result.digest,
          os: result.os,
          ...result.counts,
          fixable: result.fixable,
          vulnerabilities: result.vulnerabilities,
          error: null,
          errorKind: null,
          scannedAt: now,
          attemptedAt: now,
        })
        .where(eq(imageScanTable.image, image))
      logger.info(
        `✅ Imagen escaneada: ${image} (${result.vulnerabilities.length} vulnerabilidades)`
      )
    } catch (err) {
      // Apagando: la fila se queda a medias y se retoma al volver
      if (signal.aborted) return
      const kind: ImageScanErrorKind =
        err instanceof TrivyScanError ? err.kind : "other"
      const message =
        err instanceof TrivyScanError
          ? err.message
          : "El informe de Trivy no se pudo leer"
      logger.warn({ err, image }, `⚠️ Escaneo fallido: ${image}`)
      // Se conserva el resultado anterior; solo se anota el fallo
      await db
        .update(imageScanTable)
        .set({
          status: "failed",
          error: message,
          errorKind: kind,
          attemptedAt: new Date(),
        })
        .where(eq(imageScanTable.image, image))
        .catch((dbErr) => {
          logger.error({ err: dbErr, image }, "❌ Error guardando el escaneo")
        })
    }
  }
}

// `bun --hot` vuelve a evaluar el módulo; la cola vive en globalThis para no
// duplicar escaneos en curso entre recargas.
declare global {
  var __imageScans: ImageScanQueue | undefined
}

globalThis.__imageScans ??= new ImageScanQueue()

export const imageScans = globalThis.__imageScans
