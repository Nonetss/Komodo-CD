import type { AuthSession, AuthUser } from "@komodo-cd/auth"
import { logger } from "@komodo-cd/logger"

import type { Context } from "#context"

const now = new Date("2026-01-01T00:00:00Z")

export const testUser: AuthUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  createdAt: now,
  updatedAt: now,
}

const testSession: AuthSession = {
  id: "session-1",
  token: "token",
  userId: testUser.id,
  expiresAt: new Date("2099-01-01T00:00:00Z"),
  createdAt: now,
  updatedAt: now,
  ipAddress: null,
  userAgent: null,
}

const base = {
  headers: new Headers(),
  requestId: "test-request",
  logger,
}

/** Sin cookie ni API key. */
export const anonymousContext = (): Context => ({
  ...base,
  user: null,
  session: null,
})

/** Navegador con sesión iniciada. */
export const sessionContext = (): Context => ({
  ...base,
  user: testUser,
  session: testSession,
})

/** `x-api-key` válida: hay usuario pero no sesión (ver resolveSession). */
export const apiKeyContext = (): Context => ({
  ...base,
  user: { ...testUser, name: "API Key: ci" },
  session: null,
})
