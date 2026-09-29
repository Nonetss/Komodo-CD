import {
  adminClient,
  apiKeyClient,
  genericOAuthClient,
  organizationClient,
} from "better-auth/client/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/organization/access"
import { createAuthClient } from "better-auth/react"

export const ac = createAccessControl(defaultStatements)

export const authClient = createAuthClient({
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
