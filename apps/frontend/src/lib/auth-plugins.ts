import { apiKeyClient } from "@better-auth/api-key/client"
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/organization/access"

export const ac = createAccessControl(defaultStatements)

/** Plugins compartidos por el cliente del navegador y el de SSR. */
export const authPlugins = [
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
]
