import { env } from "@komodo-cd/env/server"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import { relations } from "#relations"

export const client = createClient({ url: env.DATABASE_URL })
export const db = drizzle({ client, relations })

let closed = false

/** Cierra la conexión al apagar el backend. Idempotente. */
export function closeDb() {
  if (closed) return
  closed = true
  client.close()
}

export type Db = typeof db
