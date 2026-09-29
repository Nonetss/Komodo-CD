import { useId } from "react"

import { cn } from "@/lib/utils"

type SegmentedProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
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
        "bg-muted/70 inline-flex max-w-full overflow-x-auto rounded-lg border p-0.5 text-xs",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <label
            key={o.value}
            className={cn(
              "flex h-7 cursor-pointer items-center rounded-md px-2.5 font-medium whitespace-nowrap transition-colors has-focus-visible:ring-ring/40 has-focus-visible:ring-2",
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
          </label>
        )
      })}
    </fieldset>
  )
}
