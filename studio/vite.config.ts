import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// `yarn dev` serves the UI with hot reload and proxies /api to `./kb studio` (port 8765).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://127.0.0.1:8765" } },
  build: { chunkSizeWarningLimit: 1000 },
  test: { environment: "node" },
});
