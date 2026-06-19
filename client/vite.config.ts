import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Proxy API calls to the backend during development so the frontend
    // can use relative paths and avoid CORS issues.
    proxy: {
      // API requests: /api/upload -> http://localhost:7273/upload
      "/api": {
        target: "http://localhost:7273",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
      // Generated media (slide images, rendered video) served by the
      // backend's StaticFiles mount. Kept un-rewritten so /storage/... maps
      // 1:1 to the backend.
      "/storage": {
        target: "http://localhost:7273",
        changeOrigin: true,
      },
    },
  },
});
