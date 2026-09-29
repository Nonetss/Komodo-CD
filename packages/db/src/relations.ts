import { defineRelations } from "drizzle-orm"

import * as schema from "#schema"

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    apikeys: r.many.apikey(),
    actions: r.many.actionHistoryTable(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  verification: {},
  apikey: {
    user: r.one.user({
      from: r.apikey.referenceId,
      to: r.user.id,
      optional: true,
    }),
  },
  actionHistoryTable: {
    // Sin FK (ver action-history.ts): puede apuntar a un usuario ya borrado.
    user: r.one.user({
      from: r.actionHistoryTable.userId,
      to: r.user.id,
      optional: true,
    }),
  },
  komodoTable: {},
}))
