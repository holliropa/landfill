import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.API_PROXY_TARGET?.trim();
  const proxy = apiProxyTarget
    ? {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: false,
        },
      }
    : undefined;

  return {
    plugins: [react()],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src/") } },
    server: proxy ? { proxy } : undefined,
    preview: proxy ? { proxy } : undefined,
  };
});
