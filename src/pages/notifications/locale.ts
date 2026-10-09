import type { Locale, LocaleMap } from '../../api/types'

/** Prefer Russian, then Uzbek Latin, then Cyrillic, then anything present. */
export function pickLocale(map?: LocaleMap | null, prefer: Locale = 'ru'): string {
  if (!map) return ''
  const order: Locale[] = [prefer, 'ru', 'uz', 'uzCyrl']
  for (const k of order) {
    const v = map[k]
    if (v && v.trim()) return v
  }
  const any = Object.values(map).find((v) => v && v.trim())
  return any ?? ''
}

/** Drop empty strings so the API receives only filled locales. */
export function compactLocaleMap(map: LocaleMap): LocaleMap {
  const out: LocaleMap = {}
  for (const [k, v] of Object.entries(map) as [Locale, string | undefined][]) {
    if (v && v.trim()) out[k] = v.trim()
  }
  return out
}

export function isEmptyLocaleMap(map: LocaleMap): boolean {
  return Object.keys(compactLocaleMap(map)).length === 0
}
