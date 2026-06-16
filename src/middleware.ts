import { defineMiddleware } from "astro:middleware"
import { authClient } from "@/lib/auth"

const sessionCache = new Map<
  string,
  { session: { user: any; session: any }; expires: number }
>()
const CACHE_DURATION = 30 * 1000 // 30 s

export const onRequest = defineMiddleware(async (context, next) => {
  if (
    context.url.pathname.startsWith("/login") ||
    context.url.pathname.startsWith("/api/auth")
  ) {
    return next()
  }

  const rawCookie = context.request.headers.get("Cookie")
  const token = context.cookies.get("better-auth.session_token")
  const cookieHeader =
    rawCookie ?? (token ? `better-auth.session_token=${token.value}` : "")

  if (!cookieHeader) {
    return context.redirect("/login")
  }

  const cacheKey = token?.value ?? rawCookie ?? ""
  const now = Date.now()
  const cached = sessionCache.get(cacheKey)

  let sessionData: { user: any; session: any }

  if (cached && cached.expires > now) {
    sessionData = cached.session
  } else {
    const { data: session, error } = await authClient.getSession({
      fetchOptions: { headers: { Cookie: cookieHeader } },
    })

    if (error || !session) {
      return context.redirect("/login")
    }

    sessionData = session
    sessionCache.set(cacheKey, { session, expires: now + CACHE_DURATION })
  }

  context.locals.user = sessionData.user
  context.locals.session = sessionData.session

  return next()
})
