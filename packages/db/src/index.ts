import { env } from "@komodo-cd/env/server"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import { relations } from "#relations"

export const client = createClient({ url: env.DATABASE_URL })
export const db = drizzle({ client, relations })

export type Db = typeof db
