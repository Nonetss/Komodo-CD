import { createAuthClient } from "better-auth/react"

const normalizeEnvUrl = (value?: string) => {
  if (!value) return undefined
  // Algunos .env incluyen comillas dobles/siempre; eliminarlas evita URLs inválidas.
  return value.replace(/^['"]|['"]$/g, "")
}

/**
 * SSR / middleware: debe usar el runtime (p. ej. Docker), no import.meta.env,
 * porque Vite sustituye las variables en build y ignoran env del contenedor.
 * BACKEND_URL es el mismo host interno que expone /api/auth en producción.
 */
function getServerAuthBaseURL(): string | undefined {
  return (
    normalizeEnvUrl(process.env.BETTER_AUTH_URL) ??
    normalizeEnvUrl(process.env.BACKEND_URL) ??
    normalizeEnvUrl(import.meta.env.BETTER_AUTH_URL) ??
    normalizeEnvUrl(import.meta.env.PUBLIC_APP_URL)
  )
}

// En navegador: mismo origen que la UI (cookies alineadas con el dominio público).
// En servidor: URL interna del API de Better Auth (contenedor backend).
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (getServerAuthBaseURL() ?? "http://localhost:4321")

export const authClient = createAuthClient({ baseURL })
