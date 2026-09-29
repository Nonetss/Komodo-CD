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
   * `pill` (por defecto): botones con borde. `tabs`: pestañas subrayadas para
   * la barra de un bloque (p. ej. `CodeBlock`); el subrayado se apoya en su borde.
   */
  variant?: "pill" | "tabs"
  className?: string
  "aria-label"?: string
}

/**
 * Selector de un valor entre pocos (SegmentedPicker de console) sobre radios
 * nativos, con flechas de teclado incluidas. La opción elegida toma el acento
 * en suave (fondo al 15 % y borde al 50 %), nunca relleno sólido.
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
        variant === "pill" ? "gap-1" : "self-stretch overflow-x-auto",
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
              "has-focus-visible:ring-ring/50 flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-xs whitespace-nowrap transition-colors has-focus-visible:ring-2",
              variant === "pill" && "h-8 border",
              variant === "pill" &&
                (active
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-input text-muted-foreground hover:bg-muted/40 hover:text-foreground"),
              variant === "tabs" &&
                "relative h-full min-h-9 after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
              variant === "tabs" &&
                (active
                  ? "text-foreground after:bg-primary"
                  : "text-muted-foreground hover:text-foreground after:bg-transparent")
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
              <span
                className={cn(
                  "font-mono tabular-nums",
                  active && variant === "pill"
                    ? "opacity-70"
                    : alert && "text-danger"
                )}
              >
                {o.count}
              </span>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}
