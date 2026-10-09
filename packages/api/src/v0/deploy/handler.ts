import type { AuthUser } from "@komodo-cd/auth"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { logger } from "@komodo-cd/logger"
import type { z } from "zod"

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

    try {
      if (action === "pull" || action === "pull-redeploy") {
        await komodoService.pullImage(stack)
      }
      if (action === "redeploy" || action === "pull-redeploy") {
        await komodoService.redeploy(stack)
      }

      const message = `Acción '${action}' completada para '${stack}'`
      await saveHistory(user, stack, action, true, message)

      return { success: true, message, stack, action }
    } catch (err) {
      const message = komodoErrorMessage(err)
      logger.error({ err }, `❌ Error en deploy — stack: ${stack}`)
      await saveHistory(user, stack, action, false, message)
      await ntfyService.notifyDeployFailure({
        stack,
        action,
        message,
        user: user.name || user.email || user.id,
      })

      throw toKomodoError(err)
    }
  },
}
