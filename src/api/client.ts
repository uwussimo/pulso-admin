import type { ErrorEnvelope, LoginResponse } from './types'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
const SESSION_KEY = 'pulso-admin.session'

export type Session = LoginResponse

export class ApiError extends Error {
  status: number
  alias?: string
  code?: number | string
  body?: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    const env = body as ErrorEnvelope | undefined
    if (env && typeof env === 'object') {
      this.alias = env.alias
      this.code = env.code
    }
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

// ---- session storage ----

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    return s && typeof s.access_token === 'string' ? s : null
  } catch {
    return null
  }
}

export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore storage failures */
  }
}

const expiredListeners = new Set<() => void>()
export function onSessionExpired(fn: () => void) {
  expiredListeners.add(fn)
  return () => {
    expiredListeners.delete(fn)
  }
}

function emitExpired() {
  saveSession(null)
  expiredListeners.forEach((fn) => fn())
}

// ---- request ----

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  body?: unknown
  query?: Query
  auth?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query) {
  const url = BASE + path
  if (!query) return url
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue
    qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const current = loadSession()
    if (!current?.refresh_token) return false
    try {
      const res = await fetch(buildUrl('/internal/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      })
      if (!res.ok) return false
      const next = (await parseBody(res)) as LoginResponse
      if (!next?.access_token) return false
      saveSession(next)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, query, auth = true, signal } = opts

  const doFetch = async () => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth) {
      const s = loadSession()
      if (s?.access_token) headers.Authorization = `Bearer ${s.access_token}`
    }
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  }

  let res: Response
  try {
    res = await doFetch()
  } catch (e) {
    throw new ApiError(0, 'Нет связи с сервером', e)
  }

  if (res.status === 401 && auth && path !== '/internal/auth/login') {
    const refreshed = await refreshSession()
    if (refreshed) {
      res = await doFetch()
    }
    if (res.status === 401) {
      emitExpired()
    }
  }

  const parsed = await parseBody(res)
  if (!res.ok) {
    const env = parsed as ErrorEnvelope | undefined
    const message = (env && typeof env === 'object' && env.message) || res.statusText || `HTTP ${res.status}`
    throw new ApiError(res.status, message, parsed)
  }
  return parsed as T
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, { body, query }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
