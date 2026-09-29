import { getAppSurface, type SurfaceId } from "@/lib/app-surfaces"
import { cn } from "@/lib/utils"

export type NavItem = { key: SurfaceId; href: string; label: string }

const isActive = (path: string, href: string) =>
  path === href || path.startsWith(`${href}/`)

/** Navegación vertical de la barra lateral (escritorio). Se renderiza en SSR. */
export function SidebarNav({
  items,
  path,
}: {
  items: NavItem[]
  path: string
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = getAppSurface(item.key).icon
        const active = isActive(path, item.href)
        return (
          <a
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

/** Barra de pestañas inferior (móvil). Se renderiza en SSR. */
export function BottomNav({ items, path }: { items: NavItem[]; path: string }) {
  return (
    <nav
      className="bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map((item) => {
          const Icon = getAppSurface(item.key).icon
          const active = isActive(path, item.href)
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-meta-sm flex flex-col items-center justify-center gap-1 font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-md transition-colors",
                  active && "bg-primary/10"
                )}
              >
                <Icon aria-hidden className="size-4.5" />
              </span>
              <span className="max-w-full truncate px-1">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
