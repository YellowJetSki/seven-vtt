import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Resolve from the vtt/ directory
const projectDir = path.resolve(import.meta.dirname ?? __dirname, ".");

export default defineConfig({
  root: projectDir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(projectDir, "src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    historyApiFallback: true,
  },
  build: {
    outDir: path.resolve(projectDir, "dist"),
  },
});
