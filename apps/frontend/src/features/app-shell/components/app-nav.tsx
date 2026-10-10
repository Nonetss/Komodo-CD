import { textVariants } from "@/components/shared/brand/typography"
import { isActivePath } from "@/features/app-shell/model/active-path"
import { getAppSurface, type SurfaceId } from "@/lib/app-surfaces"
import { cn } from "@/lib/utils"

export type NavItem = { key: SurfaceId; href: string; label: string }

/**
 * Navegación horizontal de la barra superior (escritorio). Se renderiza en
 * SSR. Cada enlace ocupa toda la altura de la barra, así el subrayado del
 * elemento activo se apoya en su trazo grueso.
 */
export function TopNav({ items, path }: { items: NavItem[]; path: string }) {
  return (
    <nav className="hidden h-full items-stretch gap-6 lg:flex">
      {items.map((item) => {
        const active = isActivePath(path, item.href)
        return (
          <a
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              textVariants({ role: "label" }),
              "flex items-center font-mono whitespace-nowrap transition-colors",
              active
                ? "text-foreground shadow-[inset_0_-2px_0_var(--color-signal)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

/**
 * Barra de pestañas inferior (móvil). Se renderiza en SSR.
 *
 * El `view-transition-name` va en la propia `<nav>` fija y no en un envoltorio
 * del layout: un envoltorio sin caja ocupa el final del documento y la
 * transición anima esa posición (distinta en cada página) en vez de la barra.
 */
export function BottomNav({ items, path }: { items: NavItem[]; path: string }) {
  return (
    <nav
      className="bg-background border-rule fixed inset-x-0 bottom-0 z-40 rule-t lg:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        viewTransitionName: "bottom-nav",
      }}
    >
      {/* Una columna por superficie del registro, sin fijar cuántas son */}
      <div
        className="mx-auto grid h-16 max-w-xl"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const Icon = getAppSurface(item.key).icon
          const active = isActivePath(path, item.href)
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-meta-sm relative flex min-w-0 flex-col items-center justify-center gap-1.5 font-mono font-medium tracking-normal uppercase transition-colors",
                "after:absolute after:inset-x-2 after:top-0 after:h-0.5",
                active
                  ? "text-foreground after:bg-signal"
                  : "text-muted-foreground after:bg-transparent"
              )}
            >
              <Icon
                aria-hidden
                className={cn("size-4.5", active && "text-signal-ink")}
              />
              <span className="max-w-full truncate">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
