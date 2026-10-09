import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://api.pulso.dorim.com'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // In development the browser talks to the Vite server, which forwards
        // /internal/* to the real API. This sidesteps CORS without touching the backend.
        '/internal': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
