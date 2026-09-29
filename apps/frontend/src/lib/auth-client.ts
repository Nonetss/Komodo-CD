import { createAuthClient } from "better-auth/react"

import { authPlugins } from "@/lib/auth-plugins"

export const authClient = createAuthClient({
  plugins: authPlugins,
})
