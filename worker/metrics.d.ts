/** Types for the shared /metrics handler; the implementation is plain JS so the Worker needs no build step. */
export interface MetricsEnv {
  API_ORIGIN?: string
  POSTHOG_API_KEY?: string
  POSTHOG_PROJECT_ID?: string
  POSTHOG_HOST?: string
}
export function handleMetrics(request: Request, env: MetricsEnv): Promise<Response>
