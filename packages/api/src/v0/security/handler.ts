import { db } from "@komodo-cd/db"
import { type ImageScan, imageScanTable } from "@komodo-cd/db/schema"
import { eq, inArray } from "drizzle-orm"
import type { z } from "zod"

import { errors } from "#errors"
import { collectImages, imageScans } from "#lib/image-scans"
import { komodoService, toKomodoError } from "#lib/komodo"
import { trivyService } from "#lib/trivy"
import type { securityInput } from "#v0/security/input"
import type { ImageSummary } from "#v0/security/output"

/** Imagen → stacks que la usan, según Komodo (502/503 si falla). */
async function komodoImages() {
  try {
    return collectImages(await komodoService.listAllStacks())
  } catch (err) {
    throw toKomodoError(err)
  }
}

function toSummary(
  image: string,
  stacks: string[],
  scan: ImageScan | undefined
): ImageSummary {
  return {
    image,
    stacks,
    status: scan?.status ?? "none",
    scannedAt: scan?.scannedAt?.toISOString() ?? null,
    attemptedAt: scan?.attemptedAt?.toISOString() ?? null,
    counts: {
      critical: scan?.critical ?? 0,
      high: scan?.high ?? 0,
      medium: scan?.medium ?? 0,
      low: scan?.low ?? 0,
      unknown: scan?.unknown ?? 0,
    },
    fixable: scan?.fixable ?? 0,
    os: scan?.os ?? null,
    error: scan?.error ?? null,
    errorKind: scan?.errorKind ?? null,
  }
}

/** Lo más grave primero; a igualdad, los fallidos y luego por nombre. */
function bySeverity(a: ImageSummary, b: ImageSummary) {
  return (
    b.counts.critical - a.counts.critical ||
    b.counts.high - a.counts.high ||
    b.counts.medium - a.counts.medium ||
    b.counts.low - a.counts.low ||
    Number(b.status === "failed") - Number(a.status === "failed") ||
    a.image.localeCompare(b.image)
  )
}

export const securityHandler = {
  /**
   * Imágenes de Komodo con su último escaneo. Encola antes las que no tienen
   * información, así que la respuesta ya las da como `queued`.
   */
  list: async () => {
    const images = await komodoImages()
    const refs = [...images.keys()]
    const enabled = trivyService.isEnabled()
    if (enabled) await imageScans.enqueueMissing(refs)

    const rows =
      refs.length > 0
        ? await db
            .select()
            .from(imageScanTable)
            .where(inArray(imageScanTable.image, refs))
        : []
    const scans = new Map(rows.map((r) => [r.image, r]))

    return {
      enabled,
      images: refs
        .map((image) =>
          toSummary(image, images.get(image) ?? [], scans.get(image))
        )
        .sort(bySeverity),
    }
  },

  get: async ({ input }: { input: z.infer<typeof securityInput.get> }) => {
    const images = await komodoImages()
    const stacks = images.get(input.image)
    if (!stacks) {
      throw errors.NOT_FOUND({
        message: `Ningún stack de Komodo usa la imagen '${input.image}'`,
      })
    }
    const [scan] = await db
      .select()
      .from(imageScanTable)
      .where(eq(imageScanTable.image, input.image))
    if (!scan) {
      throw errors.NOT_FOUND({
        message: `La imagen '${input.image}' no se ha escaneado`,
      })
    }
    return {
      ...toSummary(input.image, stacks, scan),
      digest: scan.digest ?? null,
      vulnerabilities: scan.vulnerabilities,
    }
  },

  /**
   * Encola imágenes de Komodo. Solo las que usa algún stack: el backend no
   * descarga referencias arbitrarias de registries arbitrarios.
   */
  scan: async ({ input }: { input: z.infer<typeof securityInput.scan> }) => {
    if (!trivyService.isEnabled()) {
      throw errors.SERVICE_UNAVAILABLE({
        message: "Trivy no está configurado",
      })
    }
    const images = await komodoImages()
    const requested = input.images ?? [...images.keys()]
    const unknown = requested.filter((image) => !images.has(image))
    if (unknown.length > 0) {
      throw errors.BAD_REQUEST({
        message: `Ningún stack de Komodo usa: ${unknown.join(", ")}`,
      })
    }
    return { queued: await imageScans.enqueue(requested) }
  },
}
