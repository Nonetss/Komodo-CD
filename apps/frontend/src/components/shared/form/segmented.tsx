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
  className?: string
  "aria-label"?: string
}

/**
 * Selector de un valor entre pocos (SegmentedPicker de console) sobre radios
 * nativos, con flechas de teclado incluidas. La opción elegida se invierte en
 * tinta: nunca en el color de acento.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ...props
}: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset
      aria-label={props["aria-label"]}
      className={cn("flex max-w-full min-w-0 gap-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value
        const alert = o.alert && !!o.count
        return (
          <label
            key={o.value}
            className={cn(
              "has-focus-visible:ring-ring/50 flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs whitespace-nowrap transition-colors has-focus-visible:ring-2",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-input text-muted-foreground hover:bg-muted/40 hover:text-foreground"
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
                  active ? "opacity-70" : alert && "text-danger"
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
