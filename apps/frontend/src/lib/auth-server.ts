// Cliente de auth solo para el servidor: `astro:env/server` no puede acabar
// en el bundle del navegador, así que vive aparte de auth-client.ts.

import { BACKEND_URL } from "astro:env/server"
import { createAuthClient } from "better-auth/client"

import { authPlugins } from "@/lib/auth-plugins"

// El SSR corre dentro del contenedor, donde el origen público apunta al
// propio contenedor: se llega al backend por la red de compose.
export const authServer = createAuthClient({
  baseURL: BACKEND_URL,
  plugins: authPlugins,
})
