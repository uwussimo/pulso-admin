/**
 * Uzbek phone entry: the operator types digits, the field shows
 * "+998 90 123 45 67" as they go. Pasted numbers in any shape
 * ("998901234567", "90 123-45-67", "+998 (90) 123 45 67") land in the
 * same format. The country code is fixed: every account here is Uzbek.
 */

export const UZ_PREFIX = '+998 '
const LOCAL_DIGITS = 9

/** The nine local digits, from anything the user typed or pasted. */
export function localDigits(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  // Pasted as "8 90 123 45 67" (old-style trunk prefix) — drop it when it makes the number too long.
  if (d.length > LOCAL_DIGITS && d.startsWith('8')) d = d.slice(1)
  return d.slice(0, LOCAL_DIGITS)
}

/** "+998 90 123 45 67", with trailing groups absent while the number is still being typed. */
export function formatUzInput(raw: string): string {
  const d = localDigits(raw)
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return UZ_PREFIX + groups.join(' ')
}

/**
 * Next field value after an edit. When the user backspaces over a separator
 * the digit before it goes too, so one key press always removes one digit.
 */
export function nextUzInput(prev: string, next: string): string {
  if (next.length === prev.length - 1) {
    // One character was deleted: find where.
    let i = 0
    while (i < next.length && next[i] === prev[i]) i++
    const removed = prev[i]
    if (i >= UZ_PREFIX.length && removed !== undefined && !/\d/.test(removed)) {
      // A separator vanished; take the digit in front of it as well.
      const head = next.slice(0, i).replace(/\d(?=\D*$)/, '')
      return formatUzInput(head + next.slice(i))
    }
  }
  return formatUzInput(next)
}

/** E.164 for the API, or null while the number is incomplete. */
export function toE164(raw: string): string | null {
  const d = localDigits(raw)
  return d.length === LOCAL_DIGITS ? `+998${d}` : null
}
