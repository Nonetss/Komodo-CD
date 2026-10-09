import { useId } from "react"

import { cn } from "@/lib/utils"

type SegmentedOption<T extends string> = {
  value: T
  label: string
  /** Contador opcional a la derecha de la etiqueta */
  count?: number
  /** Tiñe el contador cuando es distinto de 0 (p. ej. stacks con problemas) */
  alert?: boolean
}

type SegmentedProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  /**
   * `pill` (por defecto): pestañas sueltas para filtros. `tabs`: pestañas con
   * relleno lateral para la barra de un bloque (p. ej. `CodeBlock`), donde el
   * subrayado se apoya en su trazo.
   */
  variant?: "pill" | "tabs"
  className?: string
  "aria-label"?: string
}

/**
 * Selector de un valor entre pocos sobre radios nativos, con flechas de
 * teclado incluidas. Etiquetas mono en mayúsculas; la opción elegida va en
 * tinta con un subrayado en el acento, nunca con relleno.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  variant = "pill",
  className,
  ...props
}: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset
      aria-label={props["aria-label"]}
      className={cn(
        "flex max-w-full min-w-0",
        variant === "pill"
          ? "flex-wrap gap-x-4 gap-y-1"
          : "self-stretch overflow-x-auto",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        const alert = o.alert && !!o.count
        return (
          <label
            key={o.value}
            className={cn(
              "has-focus-visible:ring-ring text-label relative flex cursor-pointer items-center justify-center gap-1.5 font-mono font-medium tracking-widest whitespace-nowrap uppercase transition-colors has-focus-visible:ring-2",
              "after:absolute after:bottom-0 after:h-0.5 after:transition-colors",
              variant === "pill" && "h-9 after:inset-x-0",
              variant === "tabs" && "h-full min-h-9 px-2.5 after:inset-x-2.5",
              active
                ? "text-foreground after:bg-signal"
                : "text-muted-foreground hover:text-foreground after:bg-transparent"
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
            {o.count !== undefined && (
              <span className={cn("tabular-nums", alert && "text-signal")}>
                {o.count}
              </span>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}
