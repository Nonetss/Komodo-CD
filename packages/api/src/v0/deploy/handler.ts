import type { AuthUser } from "@komodo-cd/auth"
import { parseActor } from "@komodo-cd/auth/actor"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { logger } from "@komodo-cd/logger"
import type { z } from "zod"

import { type DeployRun, deployEvents } from "#lib/deploy-events"
import { komodoErrorMessage, komodoService, toKomodoError } from "#lib/komodo"
import { ntfyService } from "#lib/ntfy"
import type { deployInput } from "#v0/deploy/input"

async function saveHistory(
  user: AuthUser,
  stack: string,
  action: string,
  success: boolean,
  message: string
) {
  try {
    await db.insert(actionHistoryTable).values({
      userId: user.id,
      userName: user.name || null,
      userEmail: user.email || null,
      stack,
      action,
      success,
      message,
    })
  } catch (err) {
    logger.error({ err }, "❌ Error guardando historial")
  }
}

/** Ejecución que se anuncia en el bus; el actor se lee igual que en el historial. */
function newRun(user: AuthUser, stack: string, action: string): DeployRun {
  return {
    id: crypto.randomUUID(),
    stack,
    action,
    ...parseActor({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    }),
    startedAt: new Date().toISOString(),
  }
}

export const deployHandler = {
  trigger: async ({
    user,
    input,
  }: {
    user: AuthUser
    input: z.infer<typeof deployInput.trigger>
  }) => {
    const { stack, action } = input
    logger.info(`🚀 Deploy trigger — stack: ${stack}, action: ${action}`)

    const run = newRun(user, stack, action)
    deployEvents.publishStarted(run)

    try {
      if (action === "pull" || action === "pull-redeploy") {
        await komodoService.pullImage(stack)
      }
      if (action === "redeploy" || action === "pull-redeploy") {
        await komodoService.redeploy(stack)
      }

      const message = `Acción '${action}' completada para '${stack}'`
      await saveHistory(user, stack, action, true, message)
      // Después del historial: quien refresque al recibirlo ya ve la fila
      deployEvents.publishFinished(run, { success: true, message })

      return { success: true, message, stack, action }
    } catch (err) {
      const message = komodoErrorMessage(err)
      logger.error({ err }, `❌ Error en deploy — stack: ${stack}`)
      await saveHistory(user, stack, action, false, message)
      deployEvents.publishFinished(run, { success: false, message })
      await ntfyService.notifyDeployFailure({
        stack,
        action,
        message,
        user: user.name || user.email || user.id,
      })

      throw toKomodoError(err)
    } finally {
      // Si algo inesperado se saltó el aviso, que no quede "en curso"
      deployEvents.discard(run.id)
    }
  },

  /**
   * Primero `subscribed` con los deploys en curso y después cada cambio. Se
   * suscribe antes de leer los que están en curso para no perder ninguno
   * entre medias; no repite lo publicado antes.
   */
  watch: async function* ({ signal }: { signal?: AbortSignal }) {
    const events = deployEvents.subscribe(signal)
    yield { type: "subscribed" as const, running: deployEvents.running() }
    yield* events
  },
}
