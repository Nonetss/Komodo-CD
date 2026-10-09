import { navigate } from "astro:transitions/client"
import { Search } from "lucide-react"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { Input } from "@/components/ui/input"
import { StackStateDot, stackHref, useStacks } from "@/entities/stack"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"

const MAX_RESULTS = 8

/**
 * Buscador de stacks de la barra superior: sugiere por nombre y abre la ficha
 * del elegido. Pide la lista al coger el foco, no en cada página.
 */
function StackSearchContent() {
  const { t } = useTranslation()
  const listId = useId()
  const [used, setUsed] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [active, setActive] = useState(0)
  const { data: stacks, isPending } = useStacks({ enabled: used })

  const term = search.trim().toLowerCase()
  const results = term
    ? (stacks ?? [])
        .filter((s) => s.name.toLowerCase().includes(term))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_RESULTS)
    : []
  const expanded = open && term.length > 0

  const close = () => {
    setOpen(false)
    setActive(0)
  }

  const go = (name: string) => {
    setSearch("")
    close()
    navigate(stackHref(name))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("")
      close()
    } else if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === "Enter" && expanded && results[active]) {
      e.preventDefault()
      go(results[active].name)
    }
  }

  return (
    <div className="relative w-48 xl:w-60">
      <Search
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2"
      />
      <Input
        type="search"
        role="combobox"
        aria-label={t("nav.searchStack")}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          expanded && results[active] ? `${listId}-${active}` : undefined
        }
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => {
          setUsed(true)
          setOpen(true)
        }}
        onBlur={close}
        onKeyDown={onKeyDown}
        placeholder={t("nav.searchStack")}
        className="h-9 pl-6"
      />
      {expanded ? (
        <div className="bg-background border-rule absolute inset-x-0 top-full z-40 mt-1 border-[1.5px]">
          {results.length > 0 ? (
            <div id={listId} role="listbox" className="divide-y">
              {results.map((stack, i) => (
                // El foco se queda en el campo (`aria-activedescendant`)
                <div
                  key={stack.id}
                  id={`${listId}-${i}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={i === active}
                  // `mousedown` va antes del `blur` del campo, que cerraría la lista
                  onMouseDown={(e) => {
                    e.preventDefault()
                    go(stack.name)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex h-9 cursor-pointer items-center gap-2.5 px-3 text-sm",
                    i === active && "bg-muted"
                  )}
                >
                  <StackStateDot state={stack.info.state} />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {stack.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Text
              as="p"
              id={listId}
              variant="meta-sm"
              tone="muted"
              className="px-3 py-2.5"
            >
              {isPending ? t("nav.searchLoading") : t("nav.searchNoMatch")}
            </Text>
          )}
        </div>
      ) : null}
    </div>
  )
}

export const StackSearch = withIsland(StackSearchContent)
