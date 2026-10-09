import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"

/** Toaster global: se monta una vez en el layout y sigue el tema actual. */
export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const read = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      )
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      // El hueco inferior sale de `--toast-offset-bottom` (global.css): deja
      // libre la barra de navegación inferior en todos los anchos donde se ve
      offset={{ bottom: "var(--toast-offset-bottom)", right: 24 }}
      mobileOffset={{
        bottom: "var(--toast-offset-bottom)",
        left: 12,
        right: 12,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-popover !text-popover-foreground !border-rule !rounded-lg !font-sans !shadow-lg",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-destructive",
          warning: "[&_[data-icon]]:!text-warning",
          info: "[&_[data-icon]]:!text-info",
        },
      }}
    />
  )
}
