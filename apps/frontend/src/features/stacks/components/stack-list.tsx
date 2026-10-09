import { AlertTriangle, Layers, Loader2, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { StateCard } from "@/components/shared/feedback/state-card"
import { RefreshButton } from "@/components/shared/form/refresh-button"
import { Segmented } from "@/components/shared/form/segmented"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  hasProblem,
  hasUpdate,
  type StackGroup,
  StackStateDot,
  stackHref,
} from "@/entities/stack"
import type { DeployAction, Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

export type StackCounts = Record<StackGroup, number>

/**
 * Panel de la lista: cabecera con recuentos, búsqueda, grupos, "seleccionar
 * todos" y un elemento por stack. Cada elemento es un enlace a su ficha; la
 * casilla selecciona sin abrirlo.
 */
export function StackList({
  stacks,
  counts,
  query,
  search,
  onSearch,
  group,
  onGroup,
  onClearFilters,
  openName,
  selected,
  onToggleSelected,
  onToggleAllShown,
  runningAction,
}: {
  /** Stacks ya filtrados y ordenados */
  stacks: Stack[]
  counts: StackCounts
  query: { isFetching: boolean; refetch: () => unknown }
  search: string
  onSearch: (value: string) => void
  group: StackGroup
  onGroup: (group: StackGroup) => void
  onClearFilters: () => void
  openName: string | null
  selected: Set<string>
  onToggleSelected: (name: string) => void
  onToggleAllShown: () => void
  runningAction: (name: string) => DeployAction | null
}) {
  const { t } = useTranslation()
  const shownSelected = stacks.filter((s) => selected.has(s.name)).length
  const allShownSelected = stacks.length > 0 && shownSelected === stacks.length

  return (
    <div className="flex flex-col gap-5">
      <header className="border-rule flex items-end justify-between gap-3 border-b-[1.5px] pb-5">
        <div className="min-w-0">
          <Layers aria-hidden className="text-signal mb-4 size-5" />
          <Text as="h1" variant="display">
            {t("stacks.title")}
          </Text>
          <Text as="p" variant="label" tone="muted" className="mt-3">
            <span className="text-foreground">{counts.running}</span>{" "}
            {t("stacks.count.running")} · {counts.all} {t("stacks.count.total")}
          </Text>
        </div>
        <RefreshButton query={query} label={t("stacks.refresh")} />
      </header>

      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onSearch("")}
          placeholder={t("stacks.search")}
          aria-label={t("stacks.search")}
          className="pr-7 pl-6 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label={t("stacks.clear")}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-0 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center outline-none focus-visible:ring-2"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Segmented
        value={group}
        onChange={onGroup}
        aria-label={t("stacks.filterLabel")}
        options={[
          { value: "all", label: t("stacks.filterAll"), count: counts.all },
          {
            value: "running",
            label: t("stacks.stats.running"),
            count: counts.running,
          },
          {
            value: "stopped",
            label: t("stacks.stats.stopped"),
            count: counts.stopped,
          },
          {
            value: "problems",
            label: t("stacks.stats.problems"),
            count: counts.problems,
            alert: true,
          },
        ]}
      />

      {stacks.length === 0 ? (
        <StateCard
          icon={Search}
          title={t("stacks.noMatch")}
          action={
            <Button variant="outline" icon={X} onClick={onClearFilters}>
              {t("stacks.clear")}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-meta flex w-fit cursor-pointer items-center gap-3 px-3">
            <input
              type="checkbox"
              checked={allShownSelected}
              ref={(el) => {
                if (el)
                  el.indeterminate = shownSelected > 0 && !allShownSelected
              }}
              onChange={onToggleAllShown}
              className="accent-primary size-4 shrink-0 cursor-pointer"
            />
            {t("stacks.selectAll", { count: stacks.length })}
          </label>
          <ul className="divide-y border-y">
            {stacks.map((stack) => (
              <StackListItem
                key={stack.id}
                stack={stack}
                open={stack.name === openName}
                selected={selected.has(stack.name)}
                onToggleSelected={() => onToggleSelected(stack.name)}
                running={runningAction(stack.name) !== null}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function StackListItem({
  stack,
  open,
  selected,
  onToggleSelected,
  running,
}: {
  stack: Stack
  open: boolean
  selected: boolean
  onToggleSelected: () => void
  running: boolean
}) {
  const { t } = useTranslation()
  const problem = hasProblem(stack)
  const update = hasUpdate(stack)

  // Un solo marcador a la derecha: lo que está pasando manda sobre el estado
  let marker: React.ReactNode = null
  if (running) {
    marker = (
      <Loader2
        role="img"
        aria-label={t("stacks.running")}
        className="size-3.5 shrink-0 animate-spin"
      />
    )
  } else if (problem) {
    marker = (
      <AlertTriangle
        role="img"
        aria-label={t("stacks.stats.problems")}
        className={cn("size-3.5 shrink-0", !open && "text-signal")}
      />
    )
  } else if (update) {
    marker = (
      <Text
        variant="label"
        tone={open ? "default" : "signal"}
        title={t("stacks.updateAvailable")}
      >
        {t("stacks.updateTag")}
      </Text>
    )
  }

  return (
    <li
      className={cn(
        "flex items-center transition-colors",
        open ? "bg-foreground text-background" : "hover:bg-muted"
      )}
    >
      <label className="flex h-11 w-10 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          aria-label={t("stacks.selectStack", { stack: stack.name })}
          className={cn(
            "size-4 shrink-0 cursor-pointer",
            open ? "accent-signal" : "accent-primary"
          )}
        />
      </label>
      <a
        href={stackHref(stack.name)}
        aria-current={open ? "page" : undefined}
        className="focus-visible:ring-ring flex h-11 min-w-0 flex-1 items-center gap-2.5 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <StackStateDot state={stack.info.state} />
        <span className="min-w-0 flex-1 truncate font-semibold">
          {stack.name}
        </span>
        {marker}
        <Text
          variant="data"
          className={cn(
            "w-5 text-right",
            open ? "text-background/70" : "text-muted-foreground"
          )}
        >
          {stack.info.services.length}
        </Text>
      </a>
    </li>
  )
}
