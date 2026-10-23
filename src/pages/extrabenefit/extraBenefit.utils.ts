import type { ExtraBenefitContent, ExtraBenefitContentMap, ExtraBenefitOffer, Locale } from '../../api/types'
import { formatShortDate } from '../../lib/format'

export function emptyContent(): ExtraBenefitContent {
  return { title: '', subtitle: '', rationale: '', rules: '' }
}

/**
 * The stored document, filled out with empty fields.
 *
 * A locale written before a field existed has it missing rather than empty —
 * reading it raw would leave `rules` undefined where the editor expects a
 * string.
 */
export function normalizeContent(doc?: ExtraBenefitContent | null): ExtraBenefitContent {
  return {
    title: doc?.title ?? '',
    subtitle: doc?.subtitle ?? '',
    rationale: doc?.rationale ?? '',
    rules: doc?.rules ?? '',
  }
}

/** Does this locale carry anything at all? */
function hasContent(doc: ExtraBenefitContent): boolean {
  return doc.title.trim() !== '' || doc.subtitle.trim() !== '' || doc.rationale.trim() !== '' || doc.rules.trim() !== ''
}

/**
 * The content map to send.
 *
 * The map is replaced wholesale on update, so a locale the operator emptied
 * has to leave the map — keeping it would store an empty document the app
 * then skips anyway. The stored copy is trimmed: a title with a trailing
 * space is a title the card renders slightly off.
 */
export function buildContent(content: ExtraBenefitContentMap): ExtraBenefitContentMap {
  const out: ExtraBenefitContentMap = {}
  for (const locale of LOCALE_ORDER) {
    const doc = content[locale]
    if (!doc) continue
    const trimmed: ExtraBenefitContent = {
      title: doc.title.trim(),
      subtitle: doc.subtitle.trim(),
      rationale: doc.rationale.trim(),
      rules: doc.rules.trim(),
    }
    if (hasContent(trimmed)) out[locale] = trimmed
  }
  return out
}

/**
 * Backend `extra_benefit_offers.status`: 100 live, 200 paused. 0 is the soft
 * delete and never reaches the panel — a deleted offer is gone from every
 * read path.
 */
export const EXTRA_BENEFIT_STATUS_LIVE = 100
export const EXTRA_BENEFIT_STATUS_PAUSED = 200

const EXTRA_BENEFIT_STATUS_LABELS = {
  live: 'Действует',
  paused: 'На паузе',
  finished: 'Завершён',
} as const

/** The fallback order the app uses to pick a locale: ru, uz, uzCyrl, then any. */
const LOCALE_ORDER: Locale[] = ['ru', 'uz', 'uzCyrl']

const LOCALE_SHORT: Record<Locale, string> = { ru: 'RU', uz: 'UZ', uzCyrl: 'ЎЗ' }

/**
 * The title the operator wrote, read in the same fallback order the app uses.
 * A list row has to name the offer, and this is the only name the operator
 * gives it.
 */
export function offerTitle(content: ExtraBenefitContentMap): string {
  for (const loc of LOCALE_ORDER) {
    const title = content[loc]?.title?.trim()
    if (title) return title
  }
  for (const doc of Object.values(content)) {
    const title = doc?.title?.trim()
    if (title) return title
  }
  return ''
}

/** The subtitle under the title — the operator's own one-liner about the offer. */
export function offerSubtitle(content: ExtraBenefitContentMap): string {
  for (const loc of LOCALE_ORDER) {
    const subtitle = content[loc]?.subtitle?.trim()
    if (subtitle) return subtitle
  }
  return ''
}

/**
 * Which locales carry a title. The app falls back when one is missing, so an
 * offer with only RU still shows — but the operator should know before they
 * publish it, which is why the list says so out loud.
 */
export function filledLocales(content: ExtraBenefitContentMap): string[] {
  return LOCALE_ORDER.filter((loc) => content[loc]?.title?.trim()).map((loc) => LOCALE_SHORT[loc])
}

export function isExpired(endsAt: string | null | undefined): boolean {
  if (!endsAt) return false
  const d = new Date(endsAt)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

/**
 * The Switch carries `status` — the operator's own decision. This carries what
 * the app does about it, and the order is load-bearing: a passed deadline
 * outranks the operator's state, so an expired offer reads «Завершён» whether
 * it is live or paused. That is the truer of the two statements.
 */
export function statusLabel(status: number, endsAt: string): string {
  if (isExpired(endsAt)) return EXTRA_BENEFIT_STATUS_LABELS.finished
  if (status !== EXTRA_BENEFIT_STATUS_LIVE) return EXTRA_BENEFIT_STATUS_LABELS.paused
  return EXTRA_BENEFIT_STATUS_LABELS.live
}

/** The window as the operator reads it: «01.11.2026 — 30.11.2026». */
export function windowLabel(offer: ExtraBenefitOffer): string {
  return `${formatShortDate(offer.starts_at)} — ${formatShortDate(offer.ends_at)}`
}
