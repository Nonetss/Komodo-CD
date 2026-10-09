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
      offset={16}
      mobileOffset={{ bottom: 88, left: 12, right: 12 }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-popover !text-popover-foreground !border-rule !border-[1.5px] !rounded-none !font-sans !shadow-lg",
          description: "!text-muted-foreground",
        },
      }}
    />
  )
}
