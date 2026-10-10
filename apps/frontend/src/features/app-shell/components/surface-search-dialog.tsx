import { navigate } from "astro:transitions/client"
import { type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DialogClose } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { StackStateDot, stackHref, useStacks } from "@/entities/stack"
import { SurfaceSearchFooter } from "@/features/app-shell/components/surface-search-footer"
import { isActivePath } from "@/features/app-shell/model/active-path"
import { matchSearch } from "@/features/app-shell/model/match-search"
import { APP_SURFACES, type AppSurface } from "@/lib/app-surfaces"
import { readRecentSurfaces, recordRecentSurface } from "@/lib/recent-surfaces"

export interface SurfaceSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ruta de la página actual, para marcarla y apuntarla en recientes */
  path: string
  /** Separa la lista de recientes de cada usuario en `localStorage` */
  userId: string
}

// Una página sale dos veces (recientes y páginas): cmdk necesita valores únicos
const RECENT_PREFIX = "recent:"

/** La cabecera de cada grupo se queda fija mientras su grupo pasa por debajo. */
const GROUP_CLASS =
  "overflow-visible **:[[cmdk-group-heading]]:sticky **:[[cmdk-group-heading]]:top-0 **:[[cmdk-group-heading]]:z-10 **:[[cmdk-group-heading]]:bg-popover"

function groupHeading(label: string) {
  return (
    <Text variant="label" tone="muted">
      {label}
    </Text>
  )
}

/** Nombre del resultado y, debajo, su descripción en una línea. */
function ItemText({
  label,
  description,
}: {
  label: ReactNode
  description?: ReactNode
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <Text variant="name" className="truncate">
        {label}
      </Text>
      {description ? (
        <Text variant="meta-sm" tone="muted" className="truncate">
          {description}
        </Text>
      ) : null}
    </span>
  )
}

/**
 * Paleta para saltar a cualquier página o stack, como el buscador de la barra
 * de `stack`. Se abre desde la barra superior o con ⌘K / Ctrl+K: escucha el
 * atajo ella misma, así la barra monta una sola por página. Apunta cada página
 * que el usuario visita para sugerir las recientes con la consulta vacía y,
 * en cuanto escribe, lista también los stacks, que pide solo con el diálogo
 * abierto (comparte caché con la página de stacks).
 */
export function SurfaceSearchDialog({
  open,
  onOpenChange,
  path,
  userId,
}: SurfaceSearchDialogProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const { data: stacks, isPending } = useStacks({ enabled: open })
  const [recentHrefs, setRecentHrefs] = useState(() =>
    readRecentSurfaces(userId)
  )

  // Solo cuentan las visitas exactas: `/stacks/web` no es una visita a `/stacks`
  useEffect(() => {
    if (!APP_SURFACES.some((surface) => surface.path === path)) return
    setRecentHrefs(recordRecentSurface(userId, path))
  }, [path, userId])

  const stackItems = (stacks ?? [])
    .map((stack) => ({ stack, href: stackHref(stack.name) }))
    .sort((a, b) => a.stack.name.localeCompare(b.stack.name))
  // En `/stacks/web` la actual es el stack `web`, no la página de stacks
  const currentHref =
    stackItems.find((item) => item.href === path)?.href ??
    APP_SURFACES.find((surface) => isActivePath(path, surface.path))?.path

  // Las rutas que ya no son páginas (una ruta borrada) se saltan
  const recentSurfaces = recentHrefs
    .filter((href) => href !== currentHref)
    .flatMap((href) => APP_SURFACES.find((s) => s.path === href) ?? [])
  const query = search.trim()
  const showRecent = query === "" && recentSurfaces.length > 0

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") return
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      event.preventDefault()
      handleOpenChange(!open)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  })

  function handleOpenChange(next: boolean) {
    if (!next) setSearch("")
    onOpenChange(next)
  }

  function handleSelect(value: string) {
    const href = value.startsWith(RECENT_PREFIX)
      ? value.slice(RECENT_PREFIX.length)
      : value
    // Se cierra antes para que el portal del diálogo ya no esté cuando la
    // View Transition cambie la página
    handleOpenChange(false)
    if (href !== currentHref) navigate(href)
  }

  function renderEnd(current: boolean) {
    return (
      <>
        {current ? (
          <Text variant="label" tone="muted" className="shrink-0">
            {t("search.current")}
          </Text>
        ) : null}
        <Kbd
          aria-hidden
          className="hidden group-data-[selected=true]:inline-flex"
        >
          ↵
        </Kbd>
      </>
    )
  }

  function renderSurface(surface: AppSurface, value: string) {
    const label = t(`nav.${surface.id}`)
    const description = t(`${surface.id}.description`)
    return (
      <CommandItem
        key={value}
        value={value}
        keywords={[label, description, t("search.pages")]}
        onSelect={handleSelect}
        className="group"
      >
        <span className="flex size-8 shrink-0 items-center justify-center">
          <surface.icon
            aria-hidden
            className="text-muted-foreground group-data-[selected=true]:text-foreground size-4 transition-colors"
          />
        </span>
        <ItemText label={label} description={description} />
        {renderEnd(surface.path === currentHref)}
      </CommandItem>
    )
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("search.title")}
      description={t("search.description")}
      filter={matchSearch}
    >
      <CommandInput
        placeholder={t("search.placeholder")}
        value={search}
        onValueChange={setSearch}
      >
        <DialogClose
          aria-label={t("search.close")}
          className="focus-visible:ring-ring/50 hover:[&>kbd]:text-foreground shrink-0 cursor-pointer outline-none focus-visible:ring-2"
        >
          <Kbd>esc</Kbd>
        </DialogClose>
      </CommandInput>
      <CommandList className="max-h-[min(60vh,440px)] scroll-pt-9 p-1">
        <CommandEmpty className="flex flex-col items-center gap-1 px-6 py-10">
          {isPending ? (
            <Text variant="meta" tone="muted">
              {t("search.loading")}
            </Text>
          ) : (
            <>
              <Text as="p" variant="name">
                {t("search.noMatch", { query })}
              </Text>
              <Text as="p" variant="meta" tone="muted">
                {t("search.noMatchHint")}
              </Text>
            </>
          )}
        </CommandEmpty>
        {showRecent ? (
          <CommandGroup
            heading={groupHeading(t("search.recent"))}
            className={GROUP_CLASS}
          >
            {recentSurfaces.map((surface) =>
              renderSurface(surface, `${RECENT_PREFIX}${surface.path}`)
            )}
          </CommandGroup>
        ) : null}
        <CommandGroup
          heading={groupHeading(t("search.pages"))}
          className={GROUP_CLASS}
        >
          {APP_SURFACES.map((surface) => renderSurface(surface, surface.path))}
        </CommandGroup>
        {query && stackItems.length > 0 ? (
          <CommandGroup
            heading={groupHeading(t("search.stacks"))}
            className={GROUP_CLASS}
          >
            {stackItems.map(({ stack, href }) => (
              <CommandItem
                key={href}
                value={href}
                keywords={[stack.name, t("search.stacks")]}
                onSelect={handleSelect}
                className="group"
              >
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <StackStateDot state={stack.info.state} />
                </span>
                <ItemText
                  label={stack.name}
                  description={t("stacks.services", {
                    count: stack.info.services.length,
                  })}
                />
                {renderEnd(href === currentHref)}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
      <SurfaceSearchFooter />
    </CommandDialog>
  )
}
