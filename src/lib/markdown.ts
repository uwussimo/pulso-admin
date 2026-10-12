import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * Notification bodies are authored as Markdown in the admin panel and read
 * as an article on mobile. Markdown is the contract: an operator can type
 * it, the app renders it with its own engine, and neither side needs the
 * other's renderer to agree on HTML.
 *
 * This module exists for the panel's own preview and detail view only —
 * the mobile app never receives rendered HTML, it receives the Markdown
 * source and renders it itself.
 */

marked.setOptions({ gfm: true, breaks: true })

// The sanitizer runs on every render because the body is operator input
// that reaches the DOM as HTML. Anything not on this list is dropped:
// no <script>, no <iframe>, no event handlers, no javascript: URLs.
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'target', 'rel', 'colspan', 'rowspan']

/** Render Markdown to sanitized HTML for display in the panel. */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source || !source.trim()) return ''
  const html = marked.parse(source, { async: false })
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // The body may only link out over https; a stored `javascript:` URL
    // would otherwise survive as a clickable link in the article view.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
  })
}

/** Strip Markdown down to the plain-text snippet the feed list shows. */
export function markdownToPlainText(source: string | null | undefined, maxLength = 160): string {
  if (!source) return ''
  const text = source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*{1,3}|_{1,3}|~~)/g, '')
    .replace(/`+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

/** True when the body contains at least one image, so the list can badge it. */
export function hasImage(source: string | null | undefined): boolean {
  return !!source && /!\[[^\]]*\]\([^)]+\)/.test(source)
}
