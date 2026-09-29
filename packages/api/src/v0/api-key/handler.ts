import { auth } from "@komodo-cd/auth"
import type { z } from "zod"

import type { Context } from "#context"
import type { apiKeyInput } from "#v0/api-key/input"

const toIsoOrNull = (date: Date | string | null | undefined) =>
  date ? new Date(date).toISOString() : null

// Better Auth lee la cookie de sesión de las headers originales del request.
export const apiKeyHandler = {
  list: async ({ context }: { context: Context }) => {
    const { apiKeys } = await auth.api.listApiKeys({
      headers: context.headers,
    })

    const keys = apiKeys.map((k) => ({
      id: k.id,
      name: k.name ?? null,
      start: k.start ?? null,
      createdAt: toIsoOrNull(k.createdAt) ?? new Date().toISOString(),
      expiresAt: toIsoOrNull(k.expiresAt),
    }))
    return { success: true, keys }
  },

  create: async ({
    context,
    input,
  }: {
    context: Context
    input: z.infer<typeof apiKeyInput.create>
  }) => {
    const data = await auth.api.createApiKey({
      headers: context.headers,
      body: { name: input.name },
    })

    return {
      success: true,
      key: data.key,
      id: data.id,
      name: data.name ?? null,
    }
  },

  remove: async ({
    context,
    input,
  }: {
    context: Context
    input: z.infer<typeof apiKeyInput.remove>
  }) => {
    await auth.api.deleteApiKey({
      headers: context.headers,
      body: { keyId: input.id },
    })
    return { success: true }
  },
}
