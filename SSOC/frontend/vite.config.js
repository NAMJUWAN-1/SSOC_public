import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ✅ Important for refresh-cookie auth
// Frontend should call `/api/...` as a same-origin request.
// This proxy forwards `/api` to Django backend, so HttpOnly refresh cookie works with SameSite=Lax.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || "http://localhost:8000";
  // If you need to access the dev server from another device / domain, set:
  //   VITE_EXPOSE=true
  // Otherwise we keep it local-only (no extra Network URLs printed).
  const expose = String(env.VITE_EXPOSE || "").toLowerCase() === "true";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: [
        "i14b209.p.ssafy.io", // existing
      ],
      host: expose ? "0.0.0.0" : "localhost",
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
