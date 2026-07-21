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
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-firebase": ["firebase/app", "firebase/firestore", "firebase/auth"],
          "vendor-motion": ["framer-motion"],
          "vendor-zustand": ["zustand"],
          "vendor-ui": ["lucide-react"],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
