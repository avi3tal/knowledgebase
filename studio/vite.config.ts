import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

declare const process: { env: Record<string, string | undefined> };

// `yarn dev` serves the UI with hot reload and proxies /api to `./kb studio` (port 8765, or KB_API).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": process.env.KB_API ?? "http://127.0.0.1:8765" } },
  build: { chunkSizeWarningLimit: 1000 },
  test: { environment: "node" },
});
