import { env } from "@komodo-cd/env/server"
import { eq } from "drizzle-orm"

import { db } from "#index"
import { user } from "#schema"

export type SeedAdminResult =
  | { created: false; reason: "missing-env" }
  | { created: false; reason: "already-exists"; email: string }
  | { created: true; email: string }

/** Lo mínimo de Better Auth que necesita el seed, para no depender de @komodo-cd/auth. */
export type AuthLike = {
  api: {
    signUpEmail: (args: {
      body: { email: string; password: string; name: string }
    }) => Promise<{ user: { id: string } }>
  }
}

export async function seedAdmin(auth: AuthLike): Promise<SeedAdminResult> {
  const email = env.SEED_ADMIN_EMAIL
  const password = env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    return { created: false, reason: "missing-env" }
  }

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (existing.length > 0) {
    return { created: false, reason: "already-exists", email }
  }

  await auth.api.signUpEmail({
    body: { email, password, name: env.SEED_ADMIN_NAME },
  })

  return { created: true, email }
}
