// Server-only auth client. `astro:env/server` cannot be imported from code
// that ends up in the browser bundle, so this lives apart from auth-client.ts.

import { INTERNAL_BACKEND_URL } from "astro:env/server"
import {
  adminClient,
  apiKeyClient,
  genericOAuthClient,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { ac } from "@/lib/auth-client"

// SSR runs inside the container, where the public origin (localhost) points
// to the container itself — reach the backend through the compose network.
export const authServer = createAuthClient({
  baseURL: INTERNAL_BACKEND_URL,
  plugins: [
    apiKeyClient(),
    adminClient(),
    organizationClient({
      ac,
      dynamicAccessControl: {
        enabled: true,
      },
      teams: {
        enabled: true,
      },
    }),
    genericOAuthClient(),
  ],
})
