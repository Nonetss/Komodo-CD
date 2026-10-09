/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user: import("better-auth").User | null
    session: import("better-auth").Session | null
    /** Idioma de la petición, leído de la cookie `lang` en el middleware */
    lang: import("@/lib/i18n").Lang
  }
}
