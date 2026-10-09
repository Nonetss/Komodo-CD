import { LanguageSwitcherButton } from "@/components/shared/controls/language-switcher"
import { ThemeToggle } from "@/components/shared/controls/theme-toggle"
import { LogOutButton } from "@/features/app-shell/components/log-out-button"
import { withIsland } from "@/providers/island"

/**
 * Idioma, tema y cerrar sesión en una sola isla. Se monta una vez en la barra
 * lateral y otra en la cabecera móvil; el contenedor lo pone el layout (la
 * isla de Astro es `display: contents`). En la barra lateral, cerrar sesión
 * va al otro extremo.
 */
const ShellControlsContent = ({ layout }: { layout: "sidebar" | "bar" }) => (
  <>
    <LanguageSwitcherButton />
    <ThemeToggle />
    {layout === "sidebar" && <div className="flex-1" />}
    <LogOutButton />
  </>
)

export const ShellControls = withIsland(ShellControlsContent)
