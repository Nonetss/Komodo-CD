import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { Button } from "@/components/ui/button"

export interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const toggle = (e: React.MouseEvent) => {
    const next = !document.documentElement.classList.contains("dark")

    const apply = () => {
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("theme", next ? "dark" : "light")
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (!document.startViewTransition || reduceMotion) {
      flushSync(apply)
      return
    }

    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Activa las reglas de la raíz de global.css solo durante el cambio de
    // tema, para que no anulen el fundido de las navegaciones del ClientRouter
    const root = document.documentElement
    root.classList.add("theme-transitioning")

    try {
      const transition = document.startViewTransition(() => flushSync(apply))
      void transition.ready
        .then(() => {
          root.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 400,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
        .catch(() => {
          // Transición omitida o abortada (pestaña oculta, reduced motion…)
        })
      void transition.finished.finally(() => {
        root.classList.remove("theme-transitioning")
      })
    } catch {
      root.classList.remove("theme-transitioning")
      flushSync(apply)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className={className}
    >
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="block dark:hidden" aria-hidden />
    </Button>
  )
}
