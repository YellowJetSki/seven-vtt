import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import copyAssetsPlugin from "./vite-plugins/copy-assets.mjs";

export default defineConfig({
  plugins: [react(), tailwindcss(), copyAssetsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
