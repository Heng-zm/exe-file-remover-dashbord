import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Telegram iOS/WebView can show a blank panel when a lazy chunk is blocked,
        // cached stale, or loaded from the wrong base path. Keep the app in one JS
        // bundle so a successful index load always contains the UI.
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
