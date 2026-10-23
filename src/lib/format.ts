const TZ = 'Asia/Tashkent'

const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** 2026-10-09T06:08:00Z → "09.10.2026, 11:08" (Tashkent time). */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateTimeFmt.format(d).replace(', ', ', ')
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFmt.format(d)
}

/** 20000 → "20 000". Uses a regular space so it copies cleanly. */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toLocaleString('ru-RU').replace(/[  ]/g, ' ')
}

/** 20000 → "20 000 сум". */
export function formatSum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${formatNumber(n)} сум`
}

/** API money is in tiyns (1/100 сум); the panel shows whole сум. */
export function tiynsToSum(tiyns: number | null | undefined): number | null {
  if (tiyns === null || tiyns === undefined || Number.isNaN(tiyns)) return null
  return Math.trunc(tiyns / 100)
}

/** plural(3, ['чек', 'чека', 'чеков']) → "3 чека". */
export function plural(n: number, forms: [string, string, string], withNumber = true): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  let form: string
  if (abs > 10 && abs < 20) form = forms[2]
  else if (last > 1 && last < 5) form = forms[1]
  else if (last === 1) form = forms[0]
  else form = forms[2]
  return withNumber ? `${formatNumber(n)} ${form}` : form
}

/** Seconds → "1 час", "3 дня". */
export function formatDuration(seconds: number): string {
  if (seconds % 86400 === 0) return plural(seconds / 86400, ['день', 'дня', 'дней'])
  if (seconds % 3600 === 0) return plural(seconds / 3600, ['час', 'часа', 'часов'])
  if (seconds % 60 === 0) return plural(seconds / 60, ['минута', 'минуты', 'минут'])
  return plural(seconds, ['секунда', 'секунды', 'секунд'])
}

/** Returns the current Tashkent wall-clock as a value for <input type="datetime-local">. */
export function tashkentNowLocalInput(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** "2026-10-09T11:08" typed as Tashkent time → RFC3339 with the +05:00 offset. */
export function tashkentLocalToRfc3339(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return null
  const withSeconds = local.length === 16 ? `${local}:00` : local
  return `${withSeconds}+05:00`
}

export function formatPhone(phone?: string | null): string {
  if (!phone) return '—'
  const m = phone.replace(/\D/g, '').match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/)
  if (!m) return phone
  return `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`
}

/** RFC3339 → "2026-10-09T11:08" in Tashkent time, for <input type="datetime-local">. */
export function rfc3339ToTashkentLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** "с 09.10, 11:08 до 20.10, 23:59" / "бессрочно". */
export function formatDateRange(starts?: string | null, ends?: string | null): string {
  if (!starts && !ends) return 'бессрочно'
  if (starts && ends) return `${formatDateTime(starts)} — ${formatDateTime(ends)}`
  if (starts) return `с ${formatDateTime(starts)}`
  return `до ${formatDateTime(ends)}`
}

const shortDateFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** "2026-10-15T06:08:00Z" → "15.10.2026" (Tashkent time). */
export function formatShortDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return shortDateFmt.format(d).replace(/[  ]/g, ' ')
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

/**
 * "2026-10-15" → an RFC3339 moment in Tashkent. `boundary` picks the edge of
 * the picked day: 'end' covers the whole day (a deadline), 'start' opens it
 * (a campaign that begins that morning).
 */
export function fromDateInput(value: string, boundary: 'start' | 'end' = 'end'): string | undefined {
  if (!value) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  return boundary === 'start' ? `${value}T00:00:00+05:00` : `${value}T23:59:59+05:00`
}

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
