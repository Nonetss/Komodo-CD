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
      INTERNAL_BACKEND_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://localhost:3000",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api/": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    envPrefix: ["BETTER_AUTH_"],
  },
  prefetch: {
    prefetchAll: true,
  },

  integrations: [react()],
})
