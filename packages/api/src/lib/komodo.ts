import { db } from "@komodo-cd/db"
import { komodoTable } from "@komodo-cd/db/schema"
import { logger } from "@komodo-cd/logger"
import { ORPCError } from "@orpc/server"
import { eq } from "drizzle-orm"
import { KomodoClient, type Types } from "komodo_client"

import { errors } from "#errors"

/**
 * Mensaje legible de un error de Komodo. komodo_client no lanza `Error`, sino
 * `{ status, result: { error, trace } }`.
 */
export function komodoErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null && "result" in err) {
    const result = (err as { result?: { error?: unknown } }).result
    if (typeof result?.error === "string" && result.error) return result.error
  }
  return "Error desconocido"
}

/**
 * Error oRPC para un fallo hablando con Komodo: los errores ya definidos (503
 * si no hay credenciales) pasan tal cual; lo que conteste Komodo es un 502.
 */
export function toKomodoError(err: unknown) {
  if (err instanceof ORPCError) return err
  return errors.BAD_GATEWAY({ message: komodoErrorMessage(err), cause: err })
}

/**
 * Error de una tarea de Komodo que terminó mal (`Update.success: false`). El
 * mensaje es la salida del paso que falló, para el historial y el toast.
 */
export function failedUpdateError(update: Types.Update): Error {
  const failed = update.logs.find((log) => !log.success)
  const output = (failed?.stderr || failed?.stdout || "").trim()
  const detail = output || "sin detalles"
  return new Error(failed ? `${failed.stage}: ${detail}` : detail)
}

type KomodoCredentials = {
  name: string
  url: string
  key: string
  secret: string
}

class KomodoService {
  private client: ReturnType<typeof KomodoClient> | null = null
  private activeCredentials: KomodoCredentials | null = null

  async initialize() {
    try {
      const [cred] = await db.select().from(komodoTable).limit(1)

      if (!cred) {
        logger.warn(
          "⚠️ Komodo credentials not configured in database. Deploy features will be unavailable."
        )
        return
      }

      this.activeCredentials = {
        name: cred.name || "default",
        url: cred.url || "",
        key: cred.key || "",
        secret: cred.secret || "",
      }

      if (!cred.url || !cred.key || !cred.secret) {
        logger.warn(
          "⚠️ Incomplete Komodo credentials in database. Deploy features will be unavailable."
        )
        return
      }

      this.client = KomodoClient(cred.url, {
        type: "api-key",
        params: { key: cred.key, secret: cred.secret },
      })

      logger.info(`✅ Komodo client initialized for: ${cred.name}`)
    } catch (err) {
      logger.error({ err }, "❌ Failed to initialize Komodo client")
    }
  }

  private ensureClient() {
    if (!this.client) {
      throw errors.SERVICE_UNAVAILABLE({
        message: "Komodo no está configurado",
      })
    }
    return this.client
  }

  /**
   * `execute` solo encola la tarea y responde al momento; esto espera a que
   * Komodo la termine (consulta el `Update` cada segundo) y lanza si acabó mal.
   * Sin esperar, el deploy se daba por hecho antes de que cambiara nada.
   */
  private async executeAndWait(
    type: "PullStack" | "DeployStack",
    stackName: string
  ) {
    const client = this.ensureClient()
    const update = (await client.execute_and_poll(type, {
      stack: stackName,
    })) as Types.Update
    if (!update.success) throw failedUpdateError(update)
    return update
  }

  async pullImage(stackName: string) {
    logger.info(`📥 Pulling stack: ${stackName}`)

    try {
      const result = await this.executeAndWait("PullStack", stackName)
      logger.info(`✅ Pull completed for stack: ${stackName}`)
      return result
    } catch (err) {
      logger.error({ err }, `❌ Failed to pull stack ${stackName}`)
      throw err
    }
  }

  async redeploy(stackName: string) {
    logger.info(`🚀 Redeploying stack: ${stackName}`)

    try {
      const result = await this.executeAndWait("DeployStack", stackName)
      logger.info(`✅ Stack redeployed: ${stackName}`)
      return result
    } catch (err) {
      logger.error({ err }, `❌ Failed to redeploy stack ${stackName}`)
      throw err
    }
  }

  getActiveCredentials() {
    return this.activeCredentials
  }

  async updateCredentials({ name, url, key, secret }: KomodoCredentials) {
    try {
      const [existing] = await db
        .select({ id: komodoTable.id })
        .from(komodoTable)
        .limit(1)

      if (existing) {
        await db
          .update(komodoTable)
          .set({ url, key, secret, updatedAt: new Date() })
          .where(eq(komodoTable.id, existing.id))
      } else {
        await db.insert(komodoTable).values({ name, url, key, secret })
      }

      await this.initialize()
      logger.info(`✅ Komodo credentials updated for: ${name}`)
    } catch (err) {
      logger.error({ err }, "❌ Failed to update Komodo credentials")
      throw err
    }
  }

  async listCredentials() {
    return db.select().from(komodoTable)
  }

  async listAllStacks() {
    const client = this.ensureClient()
    try {
      // Komodo v2 pagina `ListStacks` (`default_pagination_limit`, 30 por
      // defecto) y `limit: 0` devuelve todos. Komodo v1 no pagina e ignora el
      // campo; los tipos de komodo_client 1.x aún no lo incluyen.
      const params = { limit: 0 } as Types.ListStacks
      return (await client.read("ListStacks", params)) as Types.StackListItem[]
    } catch (err) {
      logger.error({ err }, "❌ Failed to list stacks")
      throw err
    }
  }

  /**
   * Borra el recurso stack en Komodo (`DeleteStack`). Si el stack está en
   * marcha, Komodo baja antes sus contenedores.
   */
  async deleteStack(stackName: string) {
    const client = this.ensureClient()
    logger.info(`🗑️ Deleting stack: ${stackName}`)

    try {
      const result = await client.write("DeleteStack", { id: stackName })
      logger.info(`✅ Stack deleted: ${stackName}`)
      return result
    } catch (err) {
      logger.error({ err }, `❌ Failed to delete stack ${stackName}`)
      throw err
    }
  }

  /**
   * Activa o desactiva `poll_for_updates` del stack (`UpdateStack` con la
   * config parcial): con él activo, el Global Auto Update de Komodo comprueba
   * si hay imágenes nuevas.
   */
  async setPollForUpdates(stackName: string, enabled: boolean) {
    const client = this.ensureClient()
    logger.info(`🔁 Setting poll for updates to ${enabled}: ${stackName}`)

    try {
      const result = await client.write("UpdateStack", {
        id: stackName,
        config: { poll_for_updates: enabled },
      })
      logger.info(`✅ Poll for updates set to ${enabled}: ${stackName}`)
      return result
    } catch (err) {
      logger.error(
        { err },
        `❌ Failed to set poll for updates on stack ${stackName}`
      )
      throw err
    }
  }

  async deleteCredentials(name: string) {
    try {
      const deleted = await db
        .delete(komodoTable)
        .where(eq(komodoTable.name, name))
        .returning({ id: komodoTable.id })
      if (deleted.length === 0) {
        throw errors.NOT_FOUND({
          message: `No hay credenciales '${name}'`,
        })
      }
      this.client = null
      this.activeCredentials = null
      logger.info(`✅ Komodo credentials deleted for: ${name}`)
    } catch (err) {
      logger.error({ err }, "❌ Failed to delete Komodo credentials")
      throw err
    }
  }
}

export const komodoService = new KomodoService()
