import { Text } from '@gravity-ui/uikit'
import { makerLine } from './promo.utils'

interface Props {
  imageUrl?: string
  /** Catalogue title, e.g. «Тромбопол табл. 75 мг блистер №60». */
  fullName?: string
  makerName?: string
  makerCountry?: string
  imageSize?: number
  /** `body-2` for the compact picker rows, `subheader-1` for table and dialog. */
  titleVariant?: 'subheader-1' | 'body-2'
}

/**
 * The one row shape this panel uses for a drug: image, catalogue title, maker
 * line. Dorim.Pharmacy prints the same three facts in the same order, so an
 * operator reading both recognises the same product instead of two spellings of
 * it.
 *
 * Everything here is phrasing content, never a block: the catalog picker renders
 * this inside a `<button>`, where a `<div>` is invalid. `.product-cell` and
 * `.cell-title` set the flex layout, so a `<span>` wrapper lays out identically.
 */
export function NomenclatureCell({
  imageUrl,
  fullName,
  makerName,
  makerCountry,
  imageSize = 48,
  titleVariant = 'subheader-1',
}: Props) {
  const name = fullName?.trim() ?? ''

  return (
    <span className="product-cell">
      {imageUrl ? <img src={imageUrl} alt="" width={imageSize} height={imageSize} loading="lazy" /> : null}
      <span className="cell-title">
        {/* `title` matters only when the cell's width ceiling bites: an
            ellipsised catalogue title is otherwise unreadable in full. */}
        <Text variant={titleVariant} ellipsis title={name || undefined}>
          {name || '—'}
        </Text>
        <Text variant="caption-2" color="secondary" ellipsis>
          {makerLine(makerName, makerCountry)}
        </Text>
      </span>
    </span>
  )
}
