import { parseActor } from "@komodo-cd/auth/actor"
import { db } from "@komodo-cd/db"
import { actionHistoryTable } from "@komodo-cd/db/schema"
import { desc } from "drizzle-orm"

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
}
