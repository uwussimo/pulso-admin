// Cloudflare Worker in front of the static build: forwards /internal/* to the
// operator API so the browser stays same-origin (like the Vite dev proxy) and
// serves everything else from the uploaded assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/internal/')) {
      return env.ASSETS.fetch(request)
    }

    const origin = (env.API_ORIGIN || 'https://api.pulso.dorim.com').replace(/\/$/, '')
    const headers = new Headers(request.headers)
    for (const h of ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor']) headers.delete(h)

    const init = { method: request.method, headers, redirect: 'manual' }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer()
    }

    const upstream = await fetch(origin + url.pathname + url.search, init)
    const out = new Headers(upstream.headers)
    out.set('cache-control', 'no-store')
    return new Response(upstream.body, { status: upstream.status, headers: out })
  },
}
