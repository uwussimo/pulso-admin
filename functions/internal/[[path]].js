// Cloudflare Pages Function: forwards /internal/* to the operator API so the
// browser stays same-origin, exactly like the Vite dev proxy. Set API_ORIGIN in
// the Pages project settings to point at another environment.
const DEFAULT_ORIGIN = 'https://api.pulso.dorim.com'

export async function onRequest({ request, env }) {
  const origin = (env.API_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, '')
  const incoming = new URL(request.url)
  const target = origin + incoming.pathname + incoming.search

  const headers = new Headers(request.headers)
  for (const h of ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor']) headers.delete(h)

  const init = { method: request.method, headers, redirect: 'manual' }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(target, init)
  const out = new Headers(upstream.headers)
  out.set('cache-control', 'no-store')
  return new Response(upstream.body, { status: upstream.status, headers: out })
}
