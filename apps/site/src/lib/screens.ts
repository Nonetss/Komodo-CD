import connection from "@img/connection.png"
import deploy from "@img/deploy.png"
import history from "@img/history.png"
import overviewImage from "@img/overview.png"
import stacks from "@img/stacks.png"
import stacksLight from "@img/stacks-light.png"
import type { ImageMetadata } from "astro"
import type { TourStopId } from "@/i18n/ui"

// Las capturas son las del README (img/ en la raíz del repo), así ambos
// siguen sincronizados. Astro las convierte a WebP en el build.
export interface Screen {
  id: "overview" | TourStopId
  route: string
  image: ImageMetadata
}

export const overview: Screen = {
  id: "overview",
  route: "/",
  image: overviewImage,
}

export const tourScreens: (Screen & { id: TourStopId })[] = [
  { id: "stacks", route: "/stacks/photos", image: stacks },
  { id: "deploy", route: "/deploy", image: deploy },
  { id: "history", route: "/history", image: history },
  { id: "connection", route: "/credentials", image: connection },
  { id: "theme", route: "/stacks/photos", image: stacksLight },
]

// El paso más ancho sirve al visor a pantalla completa en pantallas grandes.
export const screenWidths = [720, 1200, 1800, 2560]
