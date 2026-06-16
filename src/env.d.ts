/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  type AdminSession = import("better-auth").Session & {
    impersonatedBy?: string | null
    activeOrganizationId?: string | null
  }
  type User = import("better-auth").UserWithRole & {
    groups: string[]
  }

  interface Locals {
    user: User | null
    session: AdminSession | null
  }
}
