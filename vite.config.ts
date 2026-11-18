import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      // Permite consultar o perfil público da Steam sem CORS em desenvolvimento.
      // Em produção, o mesmo caminho pode ser servido por um proxy/edge function.
      "/steam-api": {
        target: "https://steamcommunity.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/steam-api/, "")
      }
    }
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 900
  }
});
