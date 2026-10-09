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
