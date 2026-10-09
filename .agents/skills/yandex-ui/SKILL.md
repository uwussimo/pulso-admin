---
name: yandex-ui
description: Make any React app built on Gravity UI (@gravity-ui/uikit, @gravity-ui/icons) look and feel like a Yandex product — Yandex ID, Yandex 360, Disk, Mail, Forms — instead of Gravity's default theme. Gives the exact token overrides (near-black primary, blue links, 12–20px radii, borderless filled inputs, grey workspace with a white rounded content sheet), a complete app shell (256px sidebar with 48px rows and solid icons on the active item, collapsible 88px icon rail, account card popup, mobile top bar + drawer, dark mode), and component rules for pages, tables, forms, dialogs and states. Use whenever a prompt (EN or RU) mentions Yandex, яндекс, "like Yandex ID / 360 / Disk / Mail", "yandex style", "yandex design", or asks for a dashboard, admin panel, operator panel, internal tool or SaaS app on Gravity UI that should not look like Gravity's stock theme.
---

# Yandex UI on Gravity UI

Gravity UI is Yandex's open-source design system, but its stock theme (yellow brand, 4–8px radii, outlined inputs, flat white canvas) is **not** what Yandex products look like. Yandex ID, Yandex 360, Disk, Mail and Forms share a different, quieter language. This skill reproduces that language with semantic `--g-*` token overrides and a small set of app-level classes, so every Gravity component stays intact and still gets the right look.

Use it together with the `gravity-ui` skill (component APIs, package routing) and `ux-laws` (interaction rules). This skill decides **how it looks**; those decide **what to use** and **how it behaves**.

## The look in one paragraph

A soft grey workspace with a single white, large-radius content sheet. A left sidebar sits on the grey, not in a box: 48px rows, 20px icons, the active row has a light grey pill and a **solid** icon. One near-black primary button per screen, everything else outlined or flat. Inputs are filled grey with no border until hover/focus. Page titles are large and plain, with a small grey "eyebrow" line above them instead of a "← Back" link. Links are blue. The account lives at the bottom of the sidebar and opens a centred card (avatar, name, role, settings, theme, sign out). Dark mode mirrors it: dark grey workspace, slightly lighter sheet, light primary.

## Setup (do all five)

1. Install: `npm i @gravity-ui/uikit @gravity-ui/icons`
2. Import styles in this order, in the entry file — the theme file must come **after** Gravity's:
   ```ts
   import '@gravity-ui/uikit/styles/fonts.css'
   import '@gravity-ui/uikit/styles/styles.css'
   import './theme.css' // copy of references/theme.css
   ```
3. Wrap the app: `<ThemeProvider theme={'light' | 'dark'}>` + `ToasterProvider`/`ToasterComponent`. For Russian UI call `configure({ lang: 'ru' })` once. See [references/main.tsx](references/main.tsx).
4. Copy [references/theme.css](references/theme.css) as-is. Keep its `.g-root` / `.g-root_theme_light` / `.g-root_theme_dark` blocks untouched; add app-specific classes below them.
5. Build the shell from [references/shell.tsx](references/shell.tsx): `AppShell`, `Sidebar`, `NavItem`, `SidebarStateProvider`, `AppThemeProvider`, `useMediaQuery`. Replace `BrandMark`, the nav lists and the account props with your own.

Fonts: the token lists `'YS Text'` first and falls back to Inter/system. Do not ship Yandex Sans; the fallback stack is fine.

## Tokens (why each one exists)

| Token                                                           | Light                          | Dark                                | Why                                                                                                                                                                                         |
| --------------------------------------------------------------- | ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--g-color-base-brand`                                          | `#1f1f1f`                      | `#f2f2f2`                           | Yandex ID's primary is ink, not yellow. The whole `brand` set (hover, line, text, heavy, contrast) is overridden so `view="action"` buttons, switches, checkboxes and selection all follow. |
| `--g-color-text-link`                                           | `#1a5fd0`                      | `#7fb0ff`                           | Links stay blue even though the brand is black.                                                                                                                                             |
| `--g-color-base-selection`                                      | `rgba(0,0,0,.05)`              | `rgba(255,255,255,.08)`             | Selected rows/menu items are a grey tint, never coloured.                                                                                                                                   |
| `--g-border-radius-xs…xl`                                       | 6 / 8 / 12 / 16 / 20           | same                                | Soft corners. Buttons and inputs use `m` (12px), cards `xl` (20px), modals 24px.                                                                                                            |
| `--g-text-input-background-color` + `border-color: transparent` | `base-generic`                 | same                                | Filled, borderless inputs; border appears on hover/focus via the `-hover` / `-active` tokens. Same for TextArea.                                                                            |
| `--app-workspace-bg`                                            | `#f2f3f5`                      | `#1a1b1e`                           | The grey canvas behind everything. `body` uses it.                                                                                                                                          |
| `--app-sheet-bg`                                                | `#ffffff`                      | `#26272b`                           | The white content sheet. `.sheet` also resets `--g-color-base-background` to this so nested Gravity components match.                                                                       |
| `--app-nav-active-bg` / `--app-nav-hover-bg`                    | `#e4e6ea` / `rgba(0,0,0,.045)` | `#33353a` / `rgba(255,255,255,.05)` | Sidebar pills.                                                                                                                                                                              |
| `--app-ink` / `--app-ink-contrast`                              | `#1f1f1f` / `#fff`             | `#fff` / `#1f1f1f`                  | Logo mark background and any "ink on paper" badge. Flips in dark mode so marks never disappear.                                                                                             |
| `--app-popup-shadow`                                            | `0 8px 32px rgba(0,0,0,.14)`   | `…,.5)`                             | Account card and floating panels.                                                                                                                                                           |

Rules: only semantic `--g-*` tokens and documented component CSS APIs (`--g-button-border-radius`, `--g-text-input-*`, `--g-card-border-radius`, `--g-modal-border-radius`, …). Never restyle internal `.g-*` classes except as a last resort, and then pin the uikit version in a comment next to the hack.

## Shell geometry

| Part            | Value                                                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar width   | 256px expanded, 88px compact rail (icon only, tooltips on the right)                                                                                                                                            |
| Sidebar padding | 20px top, 16px sides (12px in compact)                                                                                                                                                                          |
| Sidebar header  | 48px row: logo mark (32px, `border-radius: 30%`, `--app-ink`) + wordmark, collapse toggle (`LayoutSideContentLeft` icon, flat-secondary, size l) on the right. In compact the header stacks: toggle above mark. |
| Nav row         | 48px tall, 16px side padding, 16px radius, 12px gap, `body-2` label. Compact: 48×48 centred.                                                                                                                    |
| Nav icon        | 20px, outline glyph at rest, **Fill** glyph when active                                                                                                                                                         |
| Group label     | `caption-2`, hint colour, uppercase (e.g. "СКОРО"); in compact a 32px hairline divider                                                                                                                          |
| Content sheet   | 8px gutter from the workspace edges, 20px radius, scrolls internally; content padding 24px top / 32px right / 40px bottom / 24px left                                                                           |
| Account button  | bottom of sidebar, 48px, avatar `m` + name (`subheader-1`) + phone/role (`caption-2`) + chevron; opens a 280px card placed `top-start` (or `right-end` in compact)                                              |
| Mobile (≤900px) | sticky 56px top bar (menu button, wordmark, avatar) + Gravity `Drawer` (296px, placement left) containing the same `Sidebar`; sheet gets 8px gutter all round                                                   |

Collapsed state persists in `localStorage`. Theme persists in `localStorage`. Both via the providers in `shell.tsx`.

## Page anatomy

```
<PageHeader eyebrow="Пользователи" title="Алишер Каримов" description="..." actions={<Button view="action" size="l">…</Button>} />
<div className="section"> …  </div>
<div className="panel">
  <div className="toolbar"> search (flex 1) · Select filters · Switch </div>
  <div className="table-wrap"> <Table /> </div>
  <div className="table-footer"> "Показано 20 из 134" · Button "Показать ещё" </div>
</div>
```

- Title is `Text variant="display-1"` as `h1`. Description `body-2` secondary. Eyebrow `body-1` secondary — plain text naming the parent section. **No "← Back" links**: the sidebar is the way back.
- Overview pages use `.tiles` → `.tile` (grey `base-generic` cards, 20px radius, value in tabular numerals). Dashed `.tile_outlined` for "not yet available" slots — explain, never fake a number.
- Detail pages use `.panel` blocks with `.panel__title` (`subheader-2`) and `.kv` key/value grids.
- Forms: `.form` column with 16px gap, `.form__row` auto-fit grid (single column under 600px), `.field` = label (`body-1` secondary) + control. All controls `size="l"`.
- Lists: Gravity `Table` inside `.panel`; `withTableActions` for row menus; rows are links to detail pages; keyset "Показать ещё" instead of numbered pagination.

## Component rules

- **Buttons**: exactly one `view="action"` (black) per screen, for the primary verb. Secondary: `outlined`. Tertiary/cancel: `flat`. Destructive confirm: `outlined-danger`. Size `l` for page actions and forms, `m` inside tables/toolbars.
- **Inputs**: `TextInput`, `TextArea`, `Select`, `NumberInput`, `PasswordInput` at `size="l"`; they are already filled/borderless from the tokens. Don't add borders or shadows.
- **Dialogs**: `Dialog maxWidth="s" fullWidth`, `Dialog.Header caption`, `Dialog.Body`, `Dialog.Footer renderButtons` with flat cancel on the left and the action on the right. Reset local state in `onTransitionOutComplete`. Money, broadcasts and deletes get a confirm dialog that restates what will happen; irreversible mass actions ask for a typed phrase. See [references/components.md](references/components.md).
- **Menus/popovers**: `DropdownMenu` with `renderSwitcher` for custom triggers (account button, row actions). Card popups get `--app-popup-shadow` and 16–20px radius.
- **Status**: `Label` with `theme` success/warning/danger/normal and short words. Never colour the whole row.
- **States**: loading = `Loader` + secondary text, centred with 40px vertical padding; error = `Alert theme="danger"` with a retry button, `layout="horizontal"`; empty = `subheader-2` + `body-2` secondary + optional action. Each state fills the panel body, not the whole page.
- **Toasts**: `useToaster().add({ name, title, theme })`, short, past tense ("Версия сохранена").
- **Typography**: `display-1` page title, `header-2` wordmark, `subheader-2` panel title, `subheader-1` row title, `body-2` body, `body-1` meta, `caption-2` eyebrow/group labels. Numbers in `.num` (tabular). Never hard-code `font-size`.
- **Icons**: `@gravity-ui/icons` at 20px in nav, 16px in buttons/menus, 14px for chevrons. Every nav item needs an outline + `…Fill` pair; when the set lacks a Fill twin, draw one (evenodd cutout of the outline) rather than substituting a different metaphor. Method in [references/icons.md](references/icons.md).
- **Links**: blue text links only inline in prose; navigation uses rows, tiles and buttons.

## Do / Don't

- Do keep the sidebar on the grey canvas, not inside a white box; only the content is a sheet.
- Do give active nav items a grey pill + solid icon; don't use a coloured bar, border or bold text.
- Do use black for primary actions; don't use Yandex yellow (it is the search/brand colour, not a product UI colour).
- Do use large radii consistently (12 for controls, 20 for cards, 24 for modals); don't mix sharp and soft corners.
- Do hide "coming soon" sections behind a dimmed nav group with an explanation page; don't fill them with placeholder numbers.
- Don't add drop shadows to cards or inputs; shadows are only for things that float (popups, toasts).
- Don't add a CTA button to the sidebar; primary actions belong to the page header.
- Don't put "← Back" links above titles; use the eyebrow.
- Don't write custom CSS with hex colours below the token blocks; reference `--g-color-*` / `--app-*`.

## Review checklist

Before calling a screen done, confirm each item:

1. Workspace is grey, content is one white 20px-radius sheet with an 8px gutter.
2. Primary button is black (`view="action"`), only one on screen.
3. Inputs are filled grey, borderless at rest, `size="l"`.
4. Active nav row has a grey pill and a solid icon; icons are 20px; rows are 48px.
5. Sidebar collapses to an 88px rail with tooltips; state survives reload.
6. Under 900px there is a top bar and a drawer, nothing overflows horizontally, tables scroll inside `.table-wrap`.
7. Page has an eyebrow (when nested), `display-1` title, no back link.
8. Dark mode: every surface uses a token; logo mark and badges stay visible.
9. Loading / error / empty states exist for every list and detail view.
10. Money/broadcast/delete actions open a confirm dialog that restates the effect.
