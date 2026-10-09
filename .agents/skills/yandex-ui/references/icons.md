# Icons: outline at rest, solid when active

Every sidebar item needs two glyphs from `@gravity-ui/icons`: the outline (`House`) and its `…Fill` twin (`HouseFill`). The active row swaps to the solid one; this is the only "active" cue besides the grey pill.

Pairs that exist in `@gravity-ui/icons` 2.22 (list all `…Fill` exports with `grep -o "as [A-Za-z]*Fill" node_modules/@gravity-ui/icons/index.d.ts` to check your version):

`House`, `Bell`, `Person`, `Star`, `Heart`, `Bookmark`, `Folder`, `FolderOpen`, `Lock`, `LockOpen`, `Clock`, `Alarm`, `Comment`, `Briefcase`, `Database`, `Databases`, `Geo`, `Pin`, `Plane`, `Thunderbolt`, `Sparkles`, `ForwardStep`, `BackwardStep`, `Play`, `Pause`, `Stop`, `CirclePlus`, `CircleMinus`, `CircleCheck`, `CircleXmark`, `CircleInfo`, `CircleQuestion`, `CircleExclamation`, `CircleArrowUp/Down/Left/Right`, `CircleChevronUp/Down/Left/Right`, `ThumbsUp`, `ThumbsDown`, `TriangleExclamation`, `Volume`.

Common nav metaphors with **no** Fill twin, so you must draw one: `Gear`, `Persons`, `Envelope`, `Calendar`, `Receipt`, `CircleDollar`, `CreditCard`, `ChartColumn`, `Tag`, `Box`, `Cart`, `Megaphone`.

## When the Fill twin is missing

Do **not** swap to a different metaphor (an arrow for "money", a square for "receipt"). Users read the icon as a word; changing it on activation is confusing. Draw the solid variant instead:

1. Take the outline SVG from `node_modules/@gravity-ui/icons/svgs/<name>.svg` (16×16 viewBox).
2. Build one `path` with `fill="currentColor"` and `fillRule="evenodd"`: the outer silhouette as the first subpath, then the inner details (coin sign, receipt lines) as subpaths drawn so the even-odd rule cuts them out.
3. Export it as a React component typed as Gravity's `IconData` and pass it to `<Icon data={…} size={20} />` like any other glyph.

```tsx
import type { SVGProps } from 'react'

export function ReceiptFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M3 1.5A1.5 1.5 0 0 1 4.5 0h7A1.5 1.5 0 0 1 13 1.5V15l-2-1.2L9 15l-1-.6L7 15l-2-1.2L3 15V1.5ZM5.5 4.25a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Zm0 3a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z"
      />
    </svg>
  )
}
```

Keep the stroke weight visually equal to the outline (details about 1.5px wide at 16px) so the two states feel like the same icon.

## Sizes

| Place                         | Size                                         |
| ----------------------------- | -------------------------------------------- |
| Sidebar nav                   | 20                                           |
| Buttons, menu items, labels   | 16                                           |
| Chevrons, inline hints        | 14                                           |
| Empty-state illustration spot | 32 in a 56px rounded square (`base-generic`) |

Wrap icons in `<Icon data={…} size={n} />`; never set `width`/`height` on the SVG directly.
