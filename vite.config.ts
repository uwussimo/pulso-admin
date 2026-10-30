import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleMetrics } from './worker/metrics.js'

/**
 * Dev twin of the Worker's /metrics/* route: the same handler, fed from .env
 * (POSTHOG_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST). The key never reaches
 * the bundle because it has no VITE_ prefix.
 */
function metricsDevRoute(env: Record<string, string>): Plugin {
  const workerEnv = {
    API_ORIGIN: env.VITE_API_PROXY_TARGET || 'https://api.pulso.dorim.com',
    POSTHOG_API_KEY: env.POSTHOG_API_KEY,
    POSTHOG_PROJECT_ID: env.POSTHOG_PROJECT_ID || '675346',
    POSTHOG_HOST: env.POSTHOG_HOST || 'https://us.posthog.com',
  }
  return {
    name: 'pulso-metrics-dev-route',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/metrics/')) return next()
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers.set(k, v)
        }
        const request = new Request(`http://localhost${req.url}`, { method: req.method, headers })
        const out = await handleMetrics(request, workerEnv)
        res.statusCode = out.status
        out.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(await out.text())
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://api.pulso.dorim.com'
  return {
    plugins: [react(), metricsDevRoute(env)],
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
        // The public survey page (/s/:id) calls the mobile API with the user's own token.
        '/v1': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
