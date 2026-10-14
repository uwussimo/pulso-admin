import { ApiError } from '../api/client'
import type {
  Locale,
  MobileSurveyResponse,
  SubmitSurveyRequest,
  SubmitSurveyResponse,
  UploadResponse,
} from '../api/types'
import { normalizeLocale } from '../surveys/i18n'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export interface Fragment {
  token: string | null
  lang: Locale
  theme?: 'light' | 'dark'
}

/** `/s/:id#token=…&lang=…&theme=…`. The hash is left in place so a reload still works. */
export function readFragment(): Fragment {
  const raw = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(raw)
  const theme = params.get('theme')
  return {
    token: params.get('token')?.trim() || null,
    lang: normalizeLocale(params.get('lang')),
    theme: theme === 'dark' || theme === 'light' ? theme : undefined,
  }
}

interface Opts {
  token: string
  body?: unknown
  form?: FormData
  signal?: AbortSignal
}

/** Thin fetch for the mobile API: bearer from the fragment, no admin session, no refresh. */
export async function publicRequest<T>(method: string, path: string, opts: Opts): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', Authorization: `Bearer ${opts.token}` }
  if (opts.body !== undefined && !opts.form) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: opts.form ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
      signal: opts.signal,
    })
  } catch (e) {
    throw new ApiError(0, 'network', e)
  }
  const text = res.status === 204 ? '' : await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = text
  }
  if (!res.ok) {
    const env = parsed as { message?: string } | undefined
    throw new ApiError(res.status, (env && typeof env === 'object' && env.message) || `HTTP ${res.status}`, parsed)
  }
  return parsed as T
}

export const publicApi = {
  getSurvey: (id: number, token: string, signal?: AbortSignal) =>
    publicRequest<MobileSurveyResponse>('GET', `/v1/surveys/${id}`, { token, signal }),
  submit: (id: number, token: string, body: SubmitSurveyRequest) =>
    publicRequest<SubmitSurveyResponse>('POST', `/v1/surveys/${id}/submit`, { token, body }),
  upload: (token: string, file: File) => {
    const form = new FormData()
    form.set('file', file, file.name)
    return publicRequest<UploadResponse>('POST', '/v1/upload', { token, form })
  },
}
