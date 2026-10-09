import { Layers, SearchX } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeployRunner } from "@/entities/deploy-action"
import { inGroup, type StackGroup, useStacks } from "@/entities/stack"
import {
  BackToList,
  StackDetail,
} from "@/features/stacks/components/stack-detail"
import {
  type StackCounts,
  StackList,
} from "@/features/stacks/components/stack-list"
import { StacksBulkBar } from "@/features/stacks/components/stacks-bulk-bar"
import type { DeployAction, Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"
import { withIsland } from "@/providers/island"

const EMPTY_STACKS: Stack[] = []

/**
 * Página de stacks, maestro–detalle: la lista a la izquierda y la ficha del
 * stack de la URL (`/stacks/<nombre>`) a la derecha. Las dos rutas montan esta
 * isla con `transition:persist`, así que búsqueda, grupo y selección siguen
 * vivos al pasar de un stack a otro; solo cambia la prop `stack`.
 */
const StacksPageContent = ({ stack: openName }: { stack: string | null }) => {
  const { t } = useTranslation()
  const stacksQuery = useStacks()
  const runner = useDeployRunner()
  const stacks = stacksQuery.data ?? EMPTY_STACKS

  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<StackGroup>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Un stack que ya no existe en Komodo sale de la selección
  useEffect(() => {
    if (!stacksQuery.isSuccess) return
    const names = new Set(stacks.map((s) => s.name))
    setSelected((prev) => {
      const next = new Set([...prev].filter((n) => names.has(n)))
      return next.size === prev.size ? prev : next
    })
  }, [stacks, stacksQuery.isSuccess])

  const counts = useMemo<StackCounts>(
    () => ({
      all: stacks.length,
      running: stacks.filter((s) => inGroup(s, "running")).length,
      stopped: stacks.filter((s) => inGroup(s, "stopped")).length,
      problems: stacks.filter((s) => inGroup(s, "problems")).length,
    }),
    [stacks]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stacks
      .filter((s) => inGroup(s, group))
      .filter((s) => q === "" || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [stacks, search, group])

  const toggleSelected = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  // Marca o desmarca solo lo visible; lo que ocultan los filtros no se toca
  const toggleAllShown = () =>
    setSelected((prev) => {
      const allShown =
        filtered.length > 0 && filtered.every((s) => prev.has(s.name))
      const next = new Set(prev)
      for (const s of filtered) {
        if (allShown) next.delete(s.name)
        else next.add(s.name)
      }
      return next
    })

  const hiddenSelected =
    selected.size - filtered.filter((s) => selected.has(s.name)).length

  const runBulk = async (action: DeployAction) => {
    const succeeded = new Set(await runner.runBulk([...selected], action))
    // Los que fallan siguen seleccionados para poder reintentarlos
    setSelected((prev) => new Set([...prev].filter((n) => !succeeded.has(n))))
  }

  const bulkDisabled =
    runner.bulkAction !== null ||
    [...selected].some((n) => runner.runningAction(n) !== null)

  const clearFilters = () => {
    setSearch("")
    setGroup("all")
  }

  // Sin datos que mostrar, la página entera es el estado (error o vacío)
  if (stacksQuery.isError || (stacksQuery.isSuccess && stacks.length === 0)) {
    const configure = (
      <Button asChild>
        <a href="/credentials">{t("stacks.configure")}</a>
      </Button>
    )
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 sm:px-6 lg:px-10 lg:pt-10">
        <PageHero
          title={t("stacks.title")}
          description={t("stacks.description")}
        />
        {stacksQuery.isError ? (
          <QueryErrorCard
            query={stacksQuery}
            title={t("stacks.errorLoad")}
            actions={configure}
          />
        ) : (
          <StateCard
            icon={Layers}
            title={t("stacks.empty")}
            description={t("stacks.emptyDescription")}
            action={configure}
          />
        )}
      </div>
    )
  }

  const open = openName ? stacks.find((s) => s.name === openName) : undefined

  let detail: React.ReactNode
  if (!stacksQuery.isSuccess) {
    detail = <DetailSkeleton />
  } else if (open) {
    detail = (
      <StackDetail
        stack={open}
        runningAction={runner.runningAction(open.name)}
        onAction={(action) => runner.run(open.name, action)}
      />
    )
  } else if (openName) {
    detail = (
      <div className="flex flex-col gap-5">
        <BackToList />
        <StateCard
          icon={SearchX}
          title={t("stacks.notFound", { name: openName })}
          description={t("stacks.notFoundDescription")}
          action={
            <Button asChild variant="outline">
              <a href="/stacks">{t("stacks.back")}</a>
            </Button>
          }
        />
      </div>
    )
  } else {
    detail = (
      <StateCard
        icon={Layers}
        title={t("stacks.pickOne")}
        description={t("stacks.pickOneDescription")}
      />
    )
  }

  // La página va a todo el ancho bajo la barra (layout `bleed`): la columna
  // de la lista pegada al borde, con su altura y su scroll, y la ficha al
  // lado. En pantallas pequeñas se ve un panel cada vez: la lista en
  // `/stacks` y la ficha en `/stacks/<nombre>`. La prop llega en SSR.
  return (
    <div className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
      <section
        aria-label={t("stacks.title")}
        className={cn(
          "border-rule flex-col lg:sticky lg:top-14 lg:flex lg:h-[calc(100dvh-3.5rem)] lg:rule-r",
          openName ? "hidden" : "flex"
        )}
      >
        {stacksQuery.isSuccess ? (
          <StackList
            stacks={filtered}
            counts={counts}
            query={stacksQuery}
            search={search}
            onSearch={setSearch}
            group={group}
            onGroup={setGroup}
            onClearFilters={clearFilters}
            openName={openName}
            selected={selected}
            onToggleSelected={toggleSelected}
            onToggleAllShown={toggleAllShown}
            runningAction={runner.runningAction}
          />
        ) : (
          <ListSkeleton />
        )}
        {selected.size > 0 && (
          <div className="px-3 pt-2 pb-3">
            <StacksBulkBar
              count={selected.size}
              hidden={hiddenSelected}
              runningAction={runner.bulkAction}
              disabled={bulkDisabled}
              onRun={runBulk}
              onClear={() => setSelected(new Set())}
            />
          </div>
        )}
      </section>
      <section
        aria-label={t("stacks.detailLabel")}
        className={cn(
          "min-w-0 px-4 pt-6 pb-16 sm:px-6 lg:block lg:px-12 lg:pt-10",
          openName ? "block" : "hidden"
        )}
      >
        {detail}
      </section>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-7 sm:px-6">
      <div className="border-rule space-y-3 rule-b pb-5">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-full" />
      <div className="divide-y border-y">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex h-11 items-center gap-3 px-3">
            <Skeleton className="size-4" />
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-4">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-14 w-72 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

export const StacksPage = withIsland(StacksPageContent)
