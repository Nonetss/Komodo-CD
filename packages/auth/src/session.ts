import { type AuthSession, type AuthUser, auth } from "#index"

export type ResolvedSession = {
  user: AuthUser | null
  session: AuthSession | null
}

const anonymous: ResolvedSession = { user: null, session: null }

/**
 * Resuelve quién hace la petición: primero por `x-api-key` (CI, GitHub
 * Actions) y si no por la cookie de sesión de Better Auth. Con API key no hay
 * sesión; el usuario se identifica como "API Key: <nombre>" en el historial.
 */
export async function resolveSession(
  headers: Headers
): Promise<ResolvedSession> {
  const key = headers.get("x-api-key")

  if (key) {
    const result = await auth.api.verifyApiKey({ body: { key } })
    if (!result.valid || !result.key) return anonymous

    const now = new Date()
    return {
      user: {
        id: result.key.referenceId,
        name: result.key.name ? `API Key: ${result.key.name}` : "API Key",
        email: "",
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      },
      session: null,
    }
  }

  const session = await auth.api.getSession({ headers })
  return session ? { user: session.user, session: session.session } : anonymous
}
