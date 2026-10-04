// @ts-check
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"

// Web estática del proyecto, publicada en GitHub Pages bajo
// https://nonetss.github.io/Komodo-CD/. Todos los enlaces internos pasan por
// `href()` (src/lib/url.ts) para que el base path se aplique en un solo sitio.
const fontsource = fontProviders.fontsource()

export default defineConfig({
  site: "https://nonetss.github.io",
  base: "/Komodo-CD",
  trailingSlash: "always",
  output: "static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: false },
  },

  // Mismas fuentes que apps/frontend: Fontsource descargadas en el build,
  // autoalojadas y con fallback de métricas ajustadas.
  fonts: [
    {
      provider: fontsource,
      name: "Space Grotesk",
      cssVariable: "--font-grotesk",
      weights: ["300 700"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
    {
      provider: fontsource,
      name: "Space Mono",
      cssVariable: "--font-space-mono",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "SFMono-Regular", "monospace"],
    },
  ],

  markdown: {
    shikiConfig: { theme: "github-dark-default", wrap: false },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        // Capturas de la raíz del repo (las mismas que usa el README)
        "@img": fileURLToPath(new URL("../../img", import.meta.url)),
      },
    },
  },
})
