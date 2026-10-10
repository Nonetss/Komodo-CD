import { useState } from "react"

import { SearchTrigger } from "@/features/app-shell/components/search-trigger"
import { SurfaceSearchDialog } from "@/features/app-shell/components/surface-search-dialog"
import { withIsland } from "@/providers/island"

export interface SurfaceSearchProps {
  /** Ruta de la página actual */
  path: string
  /** Usuario de la sesión: cada uno tiene su lista de recientes */
  userId: string
}

/**
 * Buscador de la barra superior en una sola isla: un campo con el atajo en
 * escritorio, un botón con la lupa en móvil y la paleta que abren los dos.
 * La isla de Astro es `display: contents`, así que los disparadores se
 * colocan en la fila de controles que pone el layout.
 */
function SurfaceSearchContent({ path, userId }: SurfaceSearchProps) {
  const [open, setOpen] = useState(false)
  const openSearch = () => setOpen(true)

  return (
    <>
      <SearchTrigger
        variant="field"
        onOpen={openSearch}
        className="hidden lg:mr-5.5 lg:inline-flex"
      />
      <SearchTrigger variant="icon" onOpen={openSearch} className="lg:hidden" />
      <SurfaceSearchDialog
        open={open}
        onOpenChange={setOpen}
        path={path}
        userId={userId}
      />
    </>
  )
}

export const SurfaceSearch = withIsland(SurfaceSearchContent)
