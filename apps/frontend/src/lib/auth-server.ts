// Server-only auth client. `astro:env/server` cannot be imported from code
// that ends up in the browser bundle, so this lives apart from auth-client.ts.

import { BACKEND_URL } from "astro:env/server"
import { createAuthClient } from "better-auth/react"
import { authPlugins } from "@/lib/auth-client"

// SSR runs inside the container, where the public origin (localhost) points
// to the container itself — reach the backend through the compose network.
export const authServer = createAuthClient({
  baseURL: BACKEND_URL,
  plugins: authPlugins,
})
