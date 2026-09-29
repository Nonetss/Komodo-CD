import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

// Tablas de Better Auth (+ plugin api-key). Los timestamps son `mode:
// "timestamp"` (segundos). `$defaultFn`/`$onUpdate` solo actúan en JS, no
// cambian el DDL.
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull()

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  groups: text("groups"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
    index("session_expiresAt_idx").on(table.expiresAt),
  ]
)

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("account_userId_idx").on(table.userId),
    index("account_providerId_accountId_idx").on(
      table.providerId,
      table.accountId
    ),
  ]
)

export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert

export const apikey = sqliteTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    /** Legacy (Better Auth < 1.5). Hoy el dueño es `referenceId`. */
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    /** Dueño de la key: id de usuario (plugin con `references: "user"`). */
    referenceId: text("reference_id"),
    configId: text("config_id"),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: integer("last_refill_at", { mode: "timestamp" }),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    rateLimitTimeWindow: integer("rate_limit_time_window"),
    rateLimitMax: integer("rate_limit_max"),
    rateLimitEnabled: integer("rate_limit_enabled", { mode: "boolean" }),
    requestCount: integer("request_count").default(0).notNull(),
    remaining: integer("remaining"),
    lastRequest: integer("last_request", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikey_key_idx").on(table.key),
    index("apikey_referenceId_idx").on(table.referenceId),
    index("apikey_configId_idx").on(table.configId),
  ]
)

export type ApiKey = typeof apikey.$inferSelect
export type NewApiKey = typeof apikey.$inferInsert
