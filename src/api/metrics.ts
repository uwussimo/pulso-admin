import { api } from './client'
import type { AppMetrics } from './types'

/**
 * Mobile app analytics. The panel never talks to PostHog directly: the Worker
 * (or the Vite dev route) holds the key, checks the operator's session and
 * runs fixed queries. The browser only picks the range.
 */
export const metricsApi = {
  app: (range: 7 | 30, signal?: AbortSignal) => api.get<AppMetrics>('/metrics/app', { range }, signal),
}
