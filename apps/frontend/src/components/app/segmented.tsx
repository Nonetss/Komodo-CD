import { useId } from "react"

import { cn } from "@/lib/utils"

type SegmentedOption<T extends string> = {
  value: T
  label: string
  /** Contador opcional a la derecha de la etiqueta */
  count?: number
  /** Resalta el contador cuando es distinto de 0 (p. ej. stacks con problemas) */
  alert?: boolean
}

type SegmentedProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
  "aria-label"?: string
}

/** Control segmentado sobre radios nativos (flechas del teclado incluidas). */
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
      className={cn(
        "bg-muted inline-flex max-w-full min-w-0 overflow-x-auto rounded-lg border p-0.5 text-xs",
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
              "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 font-medium whitespace-nowrap transition-colors has-focus-visible:ring-ring/40 has-focus-visible:ring-2",
              active
                ? "bg-card text-foreground ring-border shadow-xs ring-1"
                : "text-muted-foreground hover:text-foreground"
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
                  "tabular",
                  alert
                    ? "text-danger"
                    : active
                      ? "text-muted-foreground"
                      : "text-muted-foreground/80"
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
