import { PROMO_STATUS_LABELS } from '../../lib/constants'
import { formatShortDate } from '../../lib/format'

const sumFmt = new Intl.NumberFormat('ru-RU')

// The date helpers live in lib/format: they are Tashkent arithmetic, not
// promo rules, and the goal-offer form needs the same three.
export { fromDateInput, startOfToday, toDateInput } from '../../lib/format'

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
  return formatShortDate(endsAt)
}

/**
 * The maker line the pharmacy catalogue prints under a drug: «Polpharma
 * (Польша)». The country is in parentheses because it qualifies the maker, not
 * because it is a second field — with one missing the other still reads, and a
 * row with neither shows an em dash rather than an empty second line that looks
 * like a loading row.
 */
export function makerLine(makerName?: string | null, makerCountry?: string | null): string {
  const name = makerName?.trim() ?? ''
  const country = makerCountry?.trim() ?? ''
  if (name && country) return `${name} (${country})`
  return name || country || '—'
}

/**
 * The honest reading of the effect numbers. The backend counts `receipt_items`,
 * so every purchase nobody scanned is missing — a figure labelled «Эффект» with
 * no caveat is a figure an operator will quote to a manufacturer.
 */
export const EFFECT_CAVEAT =
  'Эффект считается по чекам, которые пользователи отсканировали в приложении. Реальные продажи в аптеках могут быть выше.'
