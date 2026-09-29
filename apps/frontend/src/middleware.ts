import { defineMiddleware } from "astro:middleware"
import { splitSetCookieHeader } from "better-auth/cookies"

import { authServer } from "@/lib/auth-server"

const publicPaths = ["/login"]
// Ficheros de public/: no necesitan sesión y no deben costar una petición
// al backend.
const publicExactPaths = new Set(["/logo.svg", "/logo.png", "/logo.webp"])

function matchesPathSegment(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

function appendRefreshedCookies(
  response: Response,
  refreshedCookies: readonly string[]
) {
  for (const cookie of refreshedCookies) {
    response.headers.append("set-cookie", cookie)
  }
  return response
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname

  context.locals.session = null
  context.locals.user = null

  if (
    publicExactPaths.has(path) ||
    path.startsWith("/icons/") ||
    publicPaths.some((p) => matchesPathSegment(path, p))
  ) {
    return next()
  }

  // Con cookieCache en el backend, get-session se resuelve desde una cookie
  // firmada sin tocar la base de datos. Cuando la refresca manda Set-Cookie,
  // que hay que reenviar al navegador o la caché nunca llega a usarse.
  let refreshedCookies: string[] = []

  const sessionResult = await authServer
    .getSession({
      fetchOptions: {
        headers: Object.fromEntries(context.request.headers.entries()),
        onResponse: (ctx) => {
          refreshedCookies = splitSetCookieHeader(
            ctx.response.headers.get("set-cookie") ?? ""
          )
        },
      },
    })
    .catch((error: unknown) => ({
      data: null,
      error: {
        status: 503,
        message: error instanceof Error ? error.message : String(error),
      },
    }))

  if (sessionResult.error) {
    console.error(
      `[auth] no se pudo resolver la sesión (${path}): ${sessionResult.error.message}`
    )
    return appendRefreshedCookies(
      new Response("Service Unavailable", {
        status: 503,
        headers: { "cache-control": "no-store" },
      }),
      refreshedCookies
    )
  }

  if (sessionResult.data === null) {
    return appendRefreshedCookies(context.redirect("/login"), refreshedCookies)
  }

  context.locals.session = sessionResult.data.session
  context.locals.user = sessionResult.data.user

  return appendRefreshedCookies(await next(), refreshedCookies)
})
