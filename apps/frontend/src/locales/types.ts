import type es from "@/locales/es"

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>
}

/**
 * Forma de los diccionarios: la del español, con cualquier texto en cada
 * clave. `en.ts` la cumple con `satisfies`, así que una clave que falte o
 * sobre rompe `check-types`.
 */
export type Dictionary = Widen<typeof es>
