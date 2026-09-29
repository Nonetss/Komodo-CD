import {
  History,
  KeyRound,
  Layers,
  type LucideIcon,
  Rocket,
  Server,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type NavKey = "stacks" | "deploy" | "history" | "credentials" | "apikeys"

export type NavItem = { key: NavKey; href: string; label: string }

const ICONS: Record<NavKey, LucideIcon> = {
  stacks: Layers,
  deploy: Rocket,
  history: History,
  credentials: Server,
  apikeys: KeyRound,
}

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
        const Icon = ICONS[item.key]
        const active = isActive(path, item.href)
        return (
          <a
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active
                  ? "text-primary"
                  : "text-muted-foreground/80 group-hover:text-foreground"
              )}
            />
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
      className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map((item) => {
          const Icon = ICONS[item.key]
          const active = isActive(path, item.href)
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/12"
                )}
              >
                <Icon className="size-4.5" />
              </span>
              <span className="max-w-full truncate px-1">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
