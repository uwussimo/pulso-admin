import { PROMO_STATUS_LABELS } from '../../lib/constants'

const sumFmt = new Intl.NumberFormat('ru-RU')

const shortDateFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const TZ = 'Asia/Tashkent'

/** Backend `promo_products.status` values the panel writes. 400 (deleted) is not settable. */
export const PROMO_STATUS_LIVE = 100
export const PROMO_STATUS_PAUSED = 200

/**
 * Promo amounts arrive in whole sums, NOT tiyns — routing them through
 * `tiynsToSum()` in lib/format would render «2 000 000 сум» for a 2 000 сум
 * bonus. This formatter is the only one a promo amount may pass through.
 */
export function sums(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${sumFmt.format(n).replace(/[  ]/g, ' ')} сум`
}

/** 2000 → "2К", matching the ИКПУ badge on the mobile. */
export function compactCount(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  if (n < 1000) return sumFmt.format(n).replace(/[  ]/g, ' ')
  const k = n / 1000
  const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10
  return `${String(rounded).replace('.', ',')}К`
}

function isExpired(endsAt: string | null): boolean {
  if (!endsAt) return false
  const d = new Date(endsAt)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

/**
 * The Switch carries `status`; this carries what the app does about it. The
 * order is load-bearing: a passed deadline outranks the operator's own state,
 * so an expired product reads «Завершён» whether it is live or paused — that is
 * the truer of the two statements. Only then does the operator's decision
 * decide, and «Действует» still waits for the server's `is_live`, so the badge
 * can never claim a row is running when the feed is not serving it.
 */
export function statusLabel(status: number, isLive: boolean, endsAt: string | null): string {
  if (isExpired(endsAt)) return PROMO_STATUS_LABELS.finished
  if (status !== PROMO_STATUS_LIVE) return PROMO_STATUS_LABELS.off
  return isLive ? PROMO_STATUS_LABELS.live : PROMO_STATUS_LABELS.finished
}

/** 15.10.2026, or «бессрочно» when the product has no deadline. */
export function endsAtLabel(endsAt: string | null | undefined): string {
  if (!endsAt) return 'бессрочно'
  const d = new Date(endsAt)
  if (Number.isNaN(d.getTime())) return 'бессрочно'
  return shortDateFmt.format(d).replace(/[  ]/g, ' ')
}

/**
 * The honest reading of the effect numbers. The backend counts `receipt_items`,
 * so every purchase nobody scanned is missing — a figure labelled «Эффект» with
 * no caveat is a figure an operator will quote to a manufacturer.
 */
export const EFFECT_CAVEAT =
  'Эффект считается по чекам, которые пользователи отсканировали в приложении. Реальные продажи в аптеках могут быть выше.'

/** Midnight today in Tashkent, for the "не может быть в прошлом" check. */
export function startOfToday(): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '01'
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00+05:00`)
}

/** "2026-10-15" for <input type="date">, from an RFC3339 timestamp. */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** End of the picked day, so a deadline covers the whole day in Tashkent. */
export function fromDateInput(value: string): string | undefined {
  if (!value) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  return `${value}T23:59:59+05:00`
}
