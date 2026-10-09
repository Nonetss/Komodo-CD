import { parseActor } from "@komodo-cd/auth/actor"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { desc, gte } from "drizzle-orm"
import type { z } from "zod"

import type { historyInput } from "#v0/history/input"

const DAY_MS = 24 * 60 * 60 * 1000
// Tope de eventos de `activity`: de sobra para 90 días de una instancia normal
export const ACTIVITY_LIMIT = 10_000

export const historyHandler = {
  list: async () => {
    const rows = await db
      .select()
      .from(actionHistoryTable)
      .orderBy(desc(actionHistoryTable.createdAt))
      .limit(100)

    const history = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName ?? null,
      userEmail: r.userEmail ?? null,
      ...parseActor(r),
      stack: r.stack,
      action: r.action,
      success: r.success,
      message: r.message ?? null,
      createdAt: (r.createdAt ?? new Date()).toISOString(),
    }))

    return { success: true, history }
  },

  /**
   * Eventos de los últimos `days` días, del más reciente al más antiguo, con
   * lo justo para las cifras del resumen. Se agrupan por día en el navegador,
   * que conoce la zona horaria del usuario.
   */
  activity: async ({
    input,
  }: {
    input: z.infer<typeof historyInput.activity>
  }) => {
    const since = new Date(Date.now() - input.days * DAY_MS)
    const rows = await db
      .select({
        userId: actionHistoryTable.userId,
        userName: actionHistoryTable.userName,
        userEmail: actionHistoryTable.userEmail,
        stack: actionHistoryTable.stack,
        action: actionHistoryTable.action,
        success: actionHistoryTable.success,
        createdAt: actionHistoryTable.createdAt,
      })
      .from(actionHistoryTable)
      .where(gte(actionHistoryTable.createdAt, since))
      .orderBy(desc(actionHistoryTable.createdAt))
      .limit(ACTIVITY_LIMIT + 1)

    const truncated = rows.length > ACTIVITY_LIMIT
    const events = rows.slice(0, ACTIVITY_LIMIT).map((r) => ({
      stack: r.stack,
      action: r.action,
      success: r.success,
      via: parseActor(r).via,
      createdAt: (r.createdAt ?? new Date()).toISOString(),
    }))

    return { success: true, since: since.toISOString(), truncated, events }
  },
}
