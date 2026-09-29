import node from "@astrojs/node"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  env: {
    schema: {
      BACKEND_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://localhost:3000",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // La imagen de runtime no lleva node_modules: en build se empaqueta
      // todo en dist/server (en dev se resuelve normal).
      noExternal: process.argv.includes("dev") ? undefined : true,
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
    envPrefix: ["BETTER_AUTH_"],
  },
  prefetch: {
    prefetchAll: true,
  },

  integrations: [react()],
})
