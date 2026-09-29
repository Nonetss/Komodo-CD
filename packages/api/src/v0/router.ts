import { apiKeyRouter } from "#v0/api-key/router"
import { credentialsRouter } from "#v0/credentials/router"
import { deployRouter } from "#v0/deploy/router"
import { historyRouter } from "#v0/history/router"
import { stacksRouter } from "#v0/stacks/router"

export const v0Router = {
  deploy: deployRouter,
  credentials: credentialsRouter,
  stacks: stacksRouter,
  history: historyRouter,
  apiKey: apiKeyRouter,
}
