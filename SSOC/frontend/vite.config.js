import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || "http://localhost:8000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: [
        'i14b209.p.ssafy.io' // 사용자님의 도메인을 허용 리스트에 추가합니다.
      ],
      host: '0.0.0.0', // 컨테이너 외부 노출을 위해 필요
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
