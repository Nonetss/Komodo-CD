/// <reference types="vite/client" />
// / <reference path="../.astro/types.d.ts" />

declare namespace App {
  // Note: 'import {} from ""' syntax does not work in .d.ts files.
  interface Locals {
    user: import("better-auth").User | null
    session: import("better-auth").Session | null
  }
}

interface ImportMetaEnv {
  readonly BETTER_AUTH_URL?: string
  readonly PUBLIC_APP_URL?: string
}
