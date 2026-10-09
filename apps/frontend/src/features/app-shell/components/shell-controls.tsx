import { LanguageSwitcherButton } from "@/components/shared/controls/language-switcher"
import { ThemeToggle } from "@/components/shared/controls/theme-toggle"
import { LogOutButton } from "@/features/app-shell/components/log-out-button"
import { withIsland } from "@/providers/island"

/**
 * Idioma, tema y cerrar sesión en una sola isla, al final de la barra
 * superior. El contenedor lo pone el layout (la isla de Astro es
 * `display: contents`).
 */
const ShellControlsContent = () => (
  <>
    <LanguageSwitcherButton />
    <ThemeToggle />
    <LogOutButton />
  </>
)

export const ShellControls = withIsland(ShellControlsContent)
