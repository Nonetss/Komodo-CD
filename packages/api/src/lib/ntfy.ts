import { db } from "@komodo-cd/db"
import { ntfyTable } from "@komodo-cd/db/schema"
import { logger } from "@komodo-cd/logger"
import { eq } from "drizzle-orm"

type NtfyConfigInput = {
  url: string
  topic: string
  token?: string
  enabled: boolean
}

type NtfyTarget = { url: string; topic: string; token?: string | null }

type NtfyMessage = {
  title: string
  message: string
  priority?: 1 | 2 | 3 | 4 | 5
  tags?: string[]
}

// Un ntfy caído no puede dejar colgado un deploy.
const PUBLISH_TIMEOUT_MS = 5000

class NtfyService {
  async getConfig() {
    const [config] = await db.select().from(ntfyTable).limit(1)
    return config ?? null
  }

  /** `token` sin definir conserva el guardado; `""` lo elimina. */
  async saveConfig({ url, topic, token, enabled }: NtfyConfigInput) {
    const existing = await this.getConfig()
    const values = {
      url,
      topic,
      token: token === undefined ? (existing?.token ?? null) : token || null,
      enabled,
    }

    if (existing) {
      await db
        .update(ntfyTable)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(ntfyTable.id, existing.id))
    } else {
      await db.insert(ntfyTable).values(values)
    }
    logger.info(`✅ ntfy configurado: ${url} → ${topic}`)
  }

  async deleteConfig() {
    await db.delete(ntfyTable)
    logger.info("✅ Configuración de ntfy eliminada")
  }

  /**
   * Publica como JSON en la raíz del servidor (no en `/<topic>`): así título y
   * mensaje viajan en el cuerpo y los caracteres no ASCII no dependen de cómo
   * se codifiquen las cabeceras.
   */
  async publish(config: NtfyTarget, msg: NtfyMessage) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (config.token) headers.Authorization = `Bearer ${config.token}`

    const res = await fetch(config.url.replace(/\/+$/, ""), {
      method: "POST",
      headers,
      body: JSON.stringify({ topic: config.topic, ...msg }),
      signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS),
    })

    if (!res.ok) {
      // ntfy responde `{ code, http, error, link }`
      const body = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      throw new Error(
        `ntfy respondió ${res.status}${body?.error ? `: ${body.error}` : ""}`
      )
    }
  }

  /** Avisa de un deploy fallido. Nunca lanza: el fallo solo se registra. */
  async notifyDeployFailure({
    stack,
    action,
    message,
    user,
  }: {
    stack: string
    action: string
    message: string
    user: string
  }) {
    try {
      const config = await this.getConfig()
      if (!config?.enabled) return

      await this.publish(config, {
        title: `Deploy fallido: ${stack}`,
        message: `Acción '${action}' lanzada por ${user}.\n\n${message}`,
        priority: 4,
        tags: ["rotating_light", stack],
      })
    } catch (err) {
      logger.error({ err }, "❌ Error enviando notificación a ntfy")
    }
  }
}

export const ntfyService = new NtfyService()
