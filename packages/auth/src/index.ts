import { apiKey } from "@better-auth/api-key"
import { db } from "@komodo-cd/db"
import * as schema from "@komodo-cd/db/schema/auth"
import { env } from "@komodo-cd/env/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  trustedProxies: ["127.0.0.1", "::1", "172.16.0.0/12", "10.0.0.0/8"],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // get-session (el middleware de Astro lo llama en cada página) se
    // resuelve desde una cookie firmada durante 60 s, sin ir a la DB.
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  plugins: [apiKey({ rateLimit: { enabled: false } })],
})

export type AuthUser = typeof auth.$Infer.Session.user
export type AuthSession = typeof auth.$Infer.Session.session
