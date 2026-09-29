// @ts-check
import node from "@astrojs/node"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField, fontProviders } from "astro/config"

const isDev = process.argv.includes("dev")

// Fuentes de Fontsource descargadas en el build (se cachean) y servidas desde
// dist: autoalojadas, solo el subset latino. Astro genera el @font-face, los
// <link rel=preload> de <Font preload /> y un fallback con métricas ajustadas
// para que el cambio de fuente no mueva el layout.
const fontsource = fontProviders.fontsource()

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),

  fonts: [
    {
      provider: fontsource,
      name: "Instrument Sans",
      cssVariable: "--font-instrument",
      weights: ["400 700"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
    {
      provider: fontsource,
      name: "Bricolage Grotesque",
      cssVariable: "--font-bricolage",
      weights: ["500 700"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "sans-serif"],
    },
    {
      provider: fontsource,
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains",
      weights: ["400 600"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "SFMono-Regular", "monospace"],
    },
  ],

  prefetch: {
    // Todas las páginas se precargan al pasar el ratón (o al tocar en móvil):
    // la navegación con ClientRouter es casi instantánea, y solo se paga el
    // render SSR + la comprobación de sesión cuando hay intención real.
    // `viewport`/`load` precargarían los 5 enlaces del menú en cada página.
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  // La barra de herramientas de dev tapa la navegación inferior en móvil
  devToolbar: { enabled: false },

  env: {
    schema: {
      // Backend para el SSR (middleware de sesión). Se lee en runtime.
      BACKEND_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://localhost:3000",
      }),
      // URL pública que aparece en los curl de ejemplo. Opcional: si no se
      // define en el build se usa el origen del navegador.
      PUBLIC_APP_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // La imagen de runtime no lleva node_modules: en build se empaqueta
      // todo en dist/server (en dev se resuelve normal).
      noExternal: isDev ? undefined : true,
    },
    optimizeDeps: {
      // Pre-empaquetadas al arrancar el dev server: evita el "optimized
      // dependencies changed. reloading" la primera vez que se abre cada isla.
      include: [
        "@orpc/client",
        "@orpc/client/fetch",
        "@orpc/tanstack-query",
        "@tanstack/react-query",
        "@hookform/resolvers/zod",
        "@radix-ui/react-label",
        "@radix-ui/react-slot",
        "react-dom/client",
        "i18next",
        "better-auth/react",
        "better-auth/client/plugins",
        "@better-auth/api-key/client",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "react-i18next",
        "lucide-react",
        "react-hook-form",
        "sonner",
        "zod",
      ],
    },
    server: {
      // Mismo enrutado que Caddy en producción (Caddyfile)
      proxy: Object.fromEntries(
        ["/api/", "/rpc/", "/doc", "/scalar"].map((path) => [
          path,
          { target: "http://localhost:3000", changeOrigin: true },
        ])
      ),
    },
  },

  integrations: [react()],
})
