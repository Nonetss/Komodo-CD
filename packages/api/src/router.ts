import type { RouterClient } from "@orpc/server"

import { v0Router } from "#v0/router"

export const appRouter = {
  v0: v0Router,
}

export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<AppRouter>
