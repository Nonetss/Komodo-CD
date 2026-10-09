import { ChevronsUpDown, Loader2 } from "lucide-react"
import {
  type ComponentProps,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { Input } from "@/components/ui/input"
import { StackStateDot } from "@/entities/stack"
import type { Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

/**
 * Selector de stack con sugerencias (combobox accesible). El resto de props
 * (`id`, `name`, `ref`, `onBlur`, `aria-*`) llegan de `FormField` y
 * `FormControl` y van al input.
 */
export function StackCombobox({
  stacks,
  loading,
  value,
  onChange,
  ...inputProps
}: {
  stacks: Stack[]
  loading: boolean
  value: string
  onChange: (value: string) => void
} & Omit<ComponentProps<"input">, "value" | "onChange">) {
  const { t } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    return [...stacks]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((s) => q === "" || s.name.toLowerCase().includes(q))
  }, [stacks, value])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const select = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter" && open && matches[highlight]) {
      e.preventDefault()
      select(matches[highlight].name)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const selected = stacks.find((s) => s.name === value)
  const TrailingIcon = loading ? Loader2 : ChevronsUpDown

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        {selected && (
          <StackStateDot
            state={selected.info.state}
            className="absolute top-1/2 left-3 -translate-y-1/2"
          />
        )}
        <Input
          {...inputProps}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setHighlight(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("deploy.stackPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          className={cn("pr-9", selected && "pl-7")}
        />
        <TrailingIcon
          className={cn(
            "text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2",
            loading && "animate-spin"
          )}
        />
      </div>

      {open && !loading && (
        <div
          id={listId}
          role="listbox"
          className="bg-popover animate-in fade-in-0 zoom-in-[0.98] absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rule border-rule p-1 shadow-md"
        >
          {matches.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-center text-xs">
              {t("deploy.noStacks")}
            </p>
          ) : (
            matches.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={s.name === value}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s.name)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
                  i === highlight && "bg-accent"
                )}
              >
                <StackStateDot state={s.info.state} />
                <span className="truncate">{s.name}</span>
                <Text variant="status" tone="muted" className="ml-auto">
                  {t(`stacks.states.${s.info.state}`, {
                    defaultValue: s.info.state,
                  })}
                </Text>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
