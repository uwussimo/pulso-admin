# IT-10508 - Promo products in the admin panel

Status: approved
Task: https://app.clickup.com/t/z93epaazmg (IT-10508 — «Back: Реализации промо
товары»; the ClickUp description is empty, the design is the attached image —
`image.png` on the task. It is the only written requirement source.)
Author: Mavis (M3) · Date: 13.10.2026
Backend spec: `service-pulso/specs/tasks/IT-10508-promo-products-admin.md` —
this document is only the panel half of that task. That spec carries
`Review tier: senior reviewer`; this half is downstream of it and inherits
that review.

> **New convention.** This repo had no `specs/` tree before this file. The
> heading structure below mirrors the backend's `specs/_TEMPLATE.md` on
> purpose so an IT-id can be traced across both repos. Pointing `CLAUDE.md`
> at it is part of this change.

## Context

`pulso-admin` already has a `/promo` entry in the sidebar — under the
dimmed **СКОРО** group, as its **first** item (`src/app/nav.ts:47`) — which
renders `src/pages/soon/SoonPages.tsx:PromoSoonPage`. That stub states the
product intent in two bullets and then says «Раздел откроется, когда бэкенд
отдаст данные»:

- **Включить / выключить** — «Фиксированный бонус за упаковку,
  пропорционально за штуки.»
- **Эффект** — «Сколько раз купили и сколько бонусов выплачено.»

It also states where the products come from, which is the constraint that
shapes the whole page: «Товары, за продвижение которых платят производители.
**Берутся из каталога**: здесь их только включают, выключают и смотрят
результат.» The panel does not own the catalog — it picks from it. That is
why the page needs a **picker** against a catalog-search API, not a
free-form product form.

The backend half of IT-10508 adds that API (`/internal/nomenclatures`) plus
CRUD over promo products (`/internal/promo/*`). This spec is what the panel
does with them.

One decision from the backend spec used to change this page's shape, and a
later one reversed it. The first pass had **no enable/disable switch**: a promo
product's `status` was the only state (`100` present, `400` soft-deleted), so
creating one made it live immediately and deleting one took it out. Mirobidjon
reviewed that build and asked for a switch on 13.10 — the page's own stub had
promised «включают, выключают» all along, and soft delete is final. The backend
now carries a third `status` value, `200` = paused, and exposes
`PATCH /internal/promo/{id}/status`; this page renders that as a `Switch`, and
the status column reports the resulting state. Delete stays what it always
was — the destructive one, with a confirmation dialog.

## Goal (outcome)

- `Промо-товары` moves from the **СКОРО** group into the main navigation and
  `/promo` renders a working page instead of `ComingSoon`.
- An operator can: search the nomenclature catalog, add a drug to the promo
  set, configure its bonus / price / deadline / ИКПУ set, **pause and resume
  it**, and delete it. A newly created product is live on the mobile
  immediately — there is no second step to remember — and a switched-off one
  leaves the mobile immediately too.
- Every promo row shows its **effect** — how many times it appeared in
  scanned receipts, and the bonus sums that implies — with copy that says
  plainly that this counts scanned receipts, not all pharmacy sales.
- The admin type file carries every new backend alias, so no operator ever
  sees a raw English error message.
- No behaviour change to any other section. The other **СКОРО** stubs
  (Апселл, Смена продукта, Акции 5+1) stay.

## Solution (how we do it)

### 1. Navigation and routing

`src/app/nav.ts` — move the entry from `NAV_SOON` (`:46-51`) to `NAV_MAIN`
(`:35-43`), dropping `soon: true`, keeping `Star` / `StarFill`:

```ts
export const NAV_MAIN: NavItem[] = [
  // ...existing...
  { to: '/promo', label: 'Промо-товары', icon: Star, iconActive: StarFill },
]
```

Position: **after `Перевод кешэка`** (`nav.ts:42`), the current last item of
`NAV_MAIN` — it is the newest area and should not outrank the sections
operators use daily. No collision: nothing follows it today.

`src/app/App.tsx:57` — repoint `/promo` from `<PromoSoonPage />` to
`<PromoPage />`, and delete `PromoSoonPage` from
`src/pages/soon/SoonPages.tsx`. While that file is open, also delete
`TransactionsSoonPage` (`:3`) — it is dead code, imported nowhere, and
`/transactions` already routes to the real page (`App.tsx:49`). The three
remaining stubs stay.

`CLAUDE.md:89` currently reads:

> `All other sections (Overview, Transactions, Promo, Upsell, Switch, Promo 5+1) show "Скоро" (coming soon).`

Fix it **wholesale**, not just for Promo: Overview and Transactions are
already live (`nav.ts:36,38`; `App.tsx:48-49`), so the line is already wrong
about them. Rewrite it to name only Апселл, Смена продукта and Акции 5+1.

### 2. API module — `src/api/promo.ts`

New module, matching `src/api/versions.ts` exactly: a plain `export const`
object of thin arrow functions, path literal inline, typed generic at the
call, nothing else. (Not frozen — `versions.ts:4` is a plain object too.)
No `fetch` outside `src/api/client.ts` (CLAUDE.md:39).

```ts
export const promoApi = {
  list: (params: PromoListParams, signal?: AbortSignal) =>
    api.get<PromoListResponse>('/internal/promo', params, signal),
  get: (id: number, signal?: AbortSignal) => api.get<PromoGetResponse>(`/internal/promo/${id}`, undefined, signal),
  create: (body: CreatePromoRequest) => api.post<PromoGetResponse>('/internal/promo', body),
  update: (id: number, body: UpdatePromoRequest) => api.put<PromoGetResponse>(`/internal/promo/${id}`, body),
  setStatus: (id: number, status: number) => api.patch<PromoGetResponse>(`/internal/promo/${id}/status`, { status }),
  remove: (id: number) => api.delete<void>(`/internal/promo/${id}`),
}

export const nomenclatureApi = {
  search: (params: NomenclatureSearchParams, signal?: AbortSignal) =>
    api.get<NomenclatureSearchResponse>('/internal/nomenclatures', params, signal),
  get: (id: number, signal?: AbortSignal) =>
    api.get<NomenclatureGetResponse>(`/internal/nomenclatures/${id}`, undefined, signal),
}
```

Three things this deliberately does **not** do:

- **No local `qs` helper.** `client.ts:77-87` (`buildUrl`) already skips
  `undefined`, `null` and `''` — the "passing `?query=` would filter to
  nothing" problem does not exist. Every other list module passes a plain
  object: `receipts.ts:14`, `users.ts:6`, `transactions.ts:6`,
  `notifications.ts:15` all use `api.get<T>(path, params, signal)`. A
  hand-rolled query builder here would be the only one in the repo.
- **No `status` on `UpdatePromoRequest`.** The pause is its own backend verb,
  so it is its own function here. Keeping `status` off the edit body is what
  stops the optimistic pause from being silently overwritten by a stale
  `PUT` — two writers to one field, each thinking it is the truth.
- **No optimistic-update machinery beyond the toggle.** It exists because a
  Switch that waits a round trip feels broken; the create / update / delete
  mutations keep the existing settle-then-invalidate behaviour.

### 3. One addition to `src/api/client.ts`

`api` currently exports `get`, `post`, `patch`, `delete`, `upload`
(`client.ts:193-203`). There is **no `put`**, and the backend update route
is `PUT /internal/promo/{id}` — kept deliberately (Mirobidjon), so the
backend does not have to bend to the panel's vocabulary.

Add exactly one method, mirroring its siblings:

```ts
put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
```

This is the **only** change to the fetch layer. `client.ts` moves from
"Not touched" to "Edited".

### 4. Types — `src/api/types.ts`

Hand-written, appended in the same style as the existing entries (snake_case
preserved, `?` for omitted, `export interface` as the dominant form — 38 of
50 entries, with `export type` reserved for unions and scalars). No codegen
exists in this repo.

```ts
/** Whole sums, like every other amount the panel renders. 0 means unset. */
export interface PromoProduct {
  id: number
  nomenclature_id: number
  name: string
  image_url: string
  maker_name: string
  ikpu_count: number
  /**
   * Backend `promo_products.status`: 100 live, 200 paused, 400 soft-deleted.
   * The table's Switch writes 100 and 200. Pausing hides the product from the
   * mobile immediately without deleting it — the row, its packages and its
   * effect history all survive it.
   */
  status: number
  /** False once status is not 100 OR once ends_at has passed. Server-derived. */
  is_live: boolean
  is_new: boolean
  bonus_amount: number
  max_price: number
  price_note: string
  applies_to: string
  ends_at: string | null
  position: number
  created_at: string
  updated_at: string
  packages: PromoPackage[]
  effect: PromoEffect | null
}

/** Scanned-receipt count only — NOT total pharmacy sales. */
export interface PromoEffect {
  purchases_count: number
  bonus_paid: number
  receipts_count: number
}
```

There is **no `status` on `UpdatePromoRequest` and no `starts_at`** — the
former belongs to the pause verb, the latter is not a column the backend has.
`is_live` is computed server-side from the same predicate that decides what
`GET /v1/products-promo` serves, so the status badge cannot drift from what the
mobile actually shows.

`src/lib/errors.ts` gains one new alias alongside the existing block:
`'promo.admin.invalid_status': 'Статус должен быть «Действует» или «Выключен»'`.

`src/lib/constants.ts` gets `PROMO_STATUS_LABELS` for the Действует /
Выключен / Завершён labels, annotated with a JSDoc block naming the backend
`status` values 100/200 — the convention at `constants.ts:19` and `:113`.

**`src/lib/errors.ts` is a required edit, not a nice-to-have.**
`errorText()` (`errors.ts:15-27`) resolves in this order: alias → `status === 0`
→ 401 → 403 → 404 → ≥500 → `e.message` → fallback. A missing alias therefore
does **not** leak raw English on a 401/403/404/5xx — it leaks it only for a
status with no arm of its own, which is exactly **400 / 409 / 422**. That is
precisely where these land, because they are validation errors:

```ts
'promo.admin.not_found': 'Промо-товар не найден',
'promo.admin.invalid_bonus': 'Бонус должен быть целым числом от 0',
'promo.admin.invalid_end_date': 'Дата окончания не может быть в прошлом',
'promo.admin.invalid_price': 'Цена должна быть целым числом от 0',
'promo.admin.duplicate_nomenclature': 'Этот товар уже есть в промо',
'promo.admin.invalid_packages': 'Выберите хотя бы один ИКПУ-код',
'nomin.invalid_id': 'Некорректный id препарата',
'nomin.upstream_unavailable': 'Каталог препаратов недоступен, попробуйте позже',
```

Note the `nomin.*` prefix — the catalog proxy's aliases are `nomin.*`, not
`nomenclatures.*`.

### 5. `src/pages/promo/` — four files

```
src/pages/promo/PromoPage.tsx          list + tiles + toolbar (the route)
src/pages/promo/PromoProductDialog.tsx create/edit form, incl. the ИКПУ picker
src/pages/promo/CatalogPickerDialog.tsx catalog search → choose a drug → create
src/pages/promo/promo.utils.ts         formatting + the effect-stats caveat string
```

#### `PromoPage.tsx` — the route

Follows `src/pages/receipts/ReceiptsPage.tsx` on data handling (note the
path — `src/pages/receipts/`, not `src/pages/`):

- **`useInfiniteQuery`** with `queryKey: ['promo', 'list', {query}]`,
  `pageParam` = `before_id`, `getNextPageParam` reads `has_more` off the last
  page (`ReceiptsPage.tsx:102-116`). `const PAGE = 25` at module scope.
- **Filters live in the URL** via `useSearchParams` with `{replace: true}`,
  so a filtered view is linkable and survives a refresh.
- **Search** is a `TextInput` in `<div className="toolbar">` with
  `startContent={<Icon data={Magnifier} …/>}` and the local
  `useDebounced(value, 350)` hook copied from `ReceiptsPage.tsx:15-22`.
  Note that hook is now triplicated across the repo
  (`ReceiptsPage.tsx:15`, `UsersPage.tsx:15`, `NotificationsPage.tsx:34`) and
  this makes it four — copy it again as the convention demands, and do not
  refactor the other three inside this task.
- **Render branches are fixed**: `isPending → LoadingState`,
  `isError → ErrorState error={query.error} onRetry={…}` (it takes both
  props, `States.tsx:17`), empty → `EmptyState`, else
  `<div className="table-wrap">` + Gravity `Table` with
  `TableColumnConfig<PromoProduct>[]`, and a `table-footer` button.

Table columns:

| Column       | Source                            | Notes                                                                                                      |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Товар        | `name`, `image_url`, `maker_name` | 48px image + two-line text cell                                                                            |
| ИКПУ         | `ikpu_count`                      | renders as `2К` / `5К` via `Intl.NumberFormat('ru')` compact — matches the mobile badge                    |
| Бонус        | `bonus_amount`                    | `sum(bonus_amount)` — **the mobile shows `2 000 сум`, never tiyns**                                        |
| Цена         | `max_price`                       | `Не более 40 000 сум`, or `—` when 0                                                                       |
| Действует до | `ends_at`                         | date; `бессрочно` when null                                                                                |
| Статус       | `status`, `is_live`               | **a `Switch` plus a badge**: the Switch writes `status` 100/200, the badge says what the app actually does |
| Эффект       | `effect`                          | `purchases_count` + `sum(bonus_paid)`                                                                      |
| `⋯`          | —                                 | `withTableActions` menu: Редактировать / Удалить                                                           |

The actions column uses the wrapped-component form the repo already uses,
not a per-column hook:

```ts
const ActionsTable = withTableActions<PromoProduct>(Table)
```

(`VersionsPage.tsx:24`, `NotificationsPage.tsx:31` — both import
`withTableActions` and `useToaster` from `@gravity-ui/uikit`.)

Above the table, a `.tiles` row with three counters, matching
`ReceiptsPage.tsx:24-86`: **Действует**, **Всего**, **Выплачено бонусов**.
All three read from `response.summary` — **never** from `items`, because the
loaded page is only the first 25 rows of the filtered set. A tile derived
from `items` reads "12 активных" on a list of 12 loaded rows out of 40
actual, with no visual cue that it is wrong. (`ReceiptsPage.tsx` already
does this correctly — its tiles read `summary.*` from
`pages[0].summary`.)

- «Действует» ← `summary.live_count`: rows the mobile list actually serves
  right now. It replaced an «Активных» tile, because there is no enable
  flag to count any more.
- «Всего» ← `summary.totals`
- «Выплачено бонусов» ← `summary.bonus_paid`

Toasts go through the hook, not a module-level object: `const toaster =
useToaster()` inside the component (`VersionsPage.tsx:27` and nine other
pages; the instance at `main.tsx:18` is module-local and **not** exported).
Mutations are `create` / `update` / `remove` / `setStatus`; each shows
`errorText(e)` in a danger toaster on failure and invalidates `['promo']` on
settle.

#### The pause switch — why it is a Switch and optimistic

The column carries two controls' worth of information and they are not the
same, so they are rendered as two things:

- **the `Switch`**, bound to `status` — the operator's decision,
- **the `Label`**, derived from `is_live` — what the mobile will do about it.

The states an operator has to be able to tell apart, and the reason a single
control cannot carry them:

| `status`   | `ends_at`     | Switch | Badge       | What the app does |
| ---------- | ------------- | ------ | ----------- | ----------------- |
| 100 live   | future / null | on     | «Действует» | shows it          |
| 200 paused | future / null | off    | «Выключен»  | does not show it  |
| 100 live   | past          | on     | «Завершён»  | does not show it  |
| 200 paused | past          | off    | «Завершён»  | does not show it  |

The third row is the one that would be invisible behind a single control: the
product is live and still absent from the app, because its own deadline passed.
Rendering only `status` would tell the operator «yes, this is running» about
something that stopped running weeks ago.

`setStatus` applies its result to the query cache **before** the request
settles (`onMutate` → `onError` rollback → `onSettle` invalidate), because a
`Switch` that does not move for a round trip reads as broken to an operator
who has just been told it is broken. The rollback path is not optional: a
failed pause that leaves the Switch off while the server still has the product
live is the panel lying about the state of the app.

The optimistic write must patch **every** cached page of the `useInfiniteQuery`,
not just page 0 — a partial write leaves the Switch stuck at the old value the
moment the operator has pressed «Показать ещё».

#### `CatalogPickerDialog.tsx` — picking the product

Opened by the page's «Добавить товар» action. A Gravity `Dialog` with a
debounced `TextInput` over `nomenclatureApi.search({query, limit: 20})`
(`useQuery`, `enabled: query.length >= 2` so an empty box does not fire a
full catalog scan), results as a scrollable list of rows: image, `name`,
`maker.name`, `full_name` as the secondary line, and the reference retail
price as `~ 40 000 сум`. Clicking a row closes the picker and opens
`PromoProductDialog` in create mode with that drug pre-loaded and its
`packages[]` pre-checked.

This dialog is the reason the page exists in the shape it does: the product
identity is **chosen**, never typed.

#### `PromoProductDialog.tsx` — create and edit

The `VersionDialog.tsx` pattern (`src/pages/versions/`), in order:

1. Outer `Dialog` owns `open`; a `key={openCount}` counter bumped in
   `onTransitionOutComplete` **remounts the form on every open**
   (`VersionDialog.tsx:42,44-51,57-65`), so an edit never shows the
   previous product's values.
2. Inner form holds one `useState` per field. **No form library** — there is
   no react-hook-form and no zod in this repo (`package.json:16-33`), and
   introducing one for a single page is a decision the team has not made.
   Validation throws inside `mutationFn` (`VersionDialog.tsx:88-95`).
3. Layout: `<div className="form__row">` for two-column rows, `<Field label
hint help required>`, Gravity controls at `size="l"`, footer `view="flat"`
   Отмена + `view="action"` with `loading={save.isPending}`.

Fields:

| Field                  | Control                                       | Rule                                                                                        |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Товар                  | read-only header (image + name + maker)       | disabled in edit mode — the catalog is not ours                                             |
| Бонус за штуку, сум    | `NumberInput`                                 | integer ≥ 0; this is the whole bonus model                                                  |
| Цена в аптеках, сум    | `NumberInput`                                 | integer ≥ 0; pre-filled from `reference_retail_price_with_vat` on create; 0 = не показывать |
| Что означает эта цена? | `TextInput`                                   | optional; renders as the «Что означает эта цена?» explainer                                 |
| Действует до           | native `<input type="date">` inside `<Field>` | optional; **cannot be in the past**                                                         |
| NEW                    | `Switch`                                      | the mobile's NEW badge, operator-set                                                        |
| Текст «где действует»  | `TextArea`                                    | pre-filled with the server default; the design's city list is per-product copy              |
| Порядок                | `NumberInput`                                 | smaller = higher in the mobile list                                                         |
| ИКПУ-коды в акции      | multi-select checkboxes                       | **at least one** — this is the «В акции участвует 5 ИКПУ-кодов» line                        |

**There is no date picker component to reach for.** `@gravity-ui/uikit`
`^7.51.0` ships no `DatePicker`, `DateInput` or `Calendar` — the only input
controls in `build/esm/components/` are `NumberInput`, `PinInput`, `Select`
and `TreeSelect`. Use a native `<input type="date">` styled with the
existing `.field` rules. It takes an ISO `yyyy-mm-dd` value directly, which
is what the backend wants for `ends_at`, and it adds no dependency.

There is also **no «Активен» field inside the create/edit form**, by design —
a created product is live immediately, and the pause is managed from the
table's Switch, which is where an operator goes to change it. Putting a second
copy of the same control in a dialog is how two controls end up disagreeing.

Validation, thrown inside `mutationFn` so it lands in the same error
surface as a server rejection:

```ts
if (!Number.isInteger(bonus) || bonus < 0) throw new Error('Бонус должен быть целым числом от 0')
if (!Number.isInteger(maxPrice) || maxPrice < 0) throw new Error('Цена должна быть целым числом от 0')
if (endsAt && new Date(endsAt) < startOfToday()) throw new Error('Дата окончания не может быть в прошлом')
if (selectedPackages.length === 0) throw new Error('Выберите хотя бы один ИКПУ-код')
```

The third rule replaces the old «must be later than Начало» check: with
`starts_at` gone there is no window, and the only invalid date is one
already in the past — which would otherwise create a product that is
invisible on the mobile with no indication why.

Submit maps `''` → `undefined` before the request, as `VersionDialog.tsx:98-104`
does — that is what makes `PUT` a _partial_ update on the backend.

#### `promo.utils.ts`

- `sums(n)` — `Intl.NumberFormat('ru-RU').format(n) + ' сум'`. Do **not**
  route promo amounts through the existing `tiynsToSum()` in
  `src/lib/format.ts:47-50`: promo amounts arrive in **whole sums, not
  tiyns**, and that mismatch renders «2 000 000 сум» instead of
  «2 000 сум». It is the easiest mistake to make on this page.
- `compactCount(n)` — `2К`, `5К`.
- `statusLabel(status, is_live, ends_at)` — «Действует» / «Выключен» /
  «Завершён», per the table above. The order of the checks is load-bearing:
  `ends_at` decides «Завершён» before `status` does, so a paused expired
  product reads as expired — which is the truer of the two.
- `PROMO_STATUS_LIVE = 100` / `PROMO_STATUS_PAUSED = 200` live beside the
  existing module constants, so the raw numbers appear in exactly one file.
- `EFFECT_CAVEAT` — the honest copy, rendered once in a muted line under the
  tiles:

  > «Эффект считается по чекам, которые пользователи отсканировали в
  > приложении. Реальные продажи в аптеках могут быть выше.»

  This is not decoration. The backend counts `receipt_items`, which
  under-reports by every purchase nobody scanned. A number labelled «Эффект»
  with no caveat is a number an operator will quote to a manufacturer.

### 6. Mock server — `mock/server.mjs`

`npm run dev:mock` is a supported workflow and `mock/server.mjs` implements
every endpoint the panel uses (788 lines, the `/internal/*` branches running
`:483`–`:786`). Adding a promo branch is part of this task, not a follow-up
— otherwise the mock silently 404s the moment someone demos the page.

Seed **three** products so every state is reachable offline: one live with
effect data, one whose `ends_at` is in the past (`is_live: false`), and one
with `ends_at: null`. Plus a `/internal/nomenclatures` branch that returns a
small fixed catalog matching on `query`.

The mock's catch-all 404 (`:786`) currently returns `{message:'no route'}`
with **no `alias` field**. The promo branches must include `alias` on every
error response — including the 404 for an unknown `nomenclature_id` — or the
`errorText()` alias path is never exercised offline and the missing-alias
regression the DoD guards against stays invisible until it reaches a real
operator.

### 7. Styling

`src/theme.css` is the single stylesheet. Reuse the existing class inventory
first — `.panel` (`:415`), `.toolbar` (`:474`), `.tiles`/`.tile_outlined`
(`:442`, `:465`), `.field` (`:531`), `.form__row` (`:525`), `.table-wrap`
(`:488`), `.table-footer` (`:499`). **Two additions are expected** and
should be the only ones:

- a `.catalog-row` grid for the picker's result rows (image + two text
  lines + right-aligned price),
- a `.product-cell` flex row for the table's image + name cell.

> There is **no `.page` class** in this stylesheet — only `.page-header`
> (`:393`). Use `.panel` (`theme.css:415`) as the page wrapper, as the other
> pages do. Adding a third class here to invent a wrapper is the signal that
> the layout is fighting the existing grid.

If a third class is needed beyond the two above, that is a signal to extend
an existing rule instead.

## Affects

- **New** — `src/api/promo.ts`,
  `src/pages/promo/{PromoPage,PromoProductDialog,CatalogPickerDialog}.tsx`,
  `src/pages/promo/promo.utils.ts`.
- **Edited** — `src/api/client.ts` (**one added method: `put`**),
  `src/app/nav.ts` (NAV_SOON → NAV_MAIN), `src/app/App.tsx` (route),
  `src/pages/soon/SoonPages.tsx` (drop `PromoSoonPage` and the dead
  `TransactionsSoonPage`), `src/api/types.ts` (append), `src/lib/constants.ts`,
  **`src/lib/errors.ts` (new aliases — required)**, `src/theme.css` (two
  classes), `mock/server.mjs`, `CLAUDE.md:89` (stale «Скоро» claim).
- **Not touched** — every other page, the auth flow, the Vite proxy and the
  Cloudflare Worker. `VITE_API_BASE` is empty and the panel is same-origin
  against `/internal/*`, so **new endpoints need no config and no CORS
  change.**
- **Contracts** — the panel is a consumer of `service-pulso`'s operator API.
  All seven new routes are additive; no existing panel call changes.
- **No dependency added.** No zod, no react-hook-form, no date library, no
  test runner.

## Non-goals

- **No tests.** This repo has no test runner and no `test` script. Adding
  vitest is its own task; do not write `npm test` into CI for this.
- **No Апселл / Смена продукта / Акции 5+1.** Three stubs remain.
- **No «Восстановить»** for a soft-deleted product — pending the backend
  spec's open question 3. The active switch covers the _temporary_ pause, not
  the deleted row.
- **No creating or renaming catalog drugs.** The panel picks; Dorim.Pharmacy
  owns the data.
- **No bulk actions** (delete ten at once, CSV import).
- **No date-range picker, no promo history view, no date filtering.**
- **No dashboard wiring.** `OverviewPage` may surface a promo tile later; not
  here.
- **No change to how money is stored** — promo amounts arrive in whole sums
  and are displayed as sums.

## Open questions

1. **Which currency label?** The backend hard-codes `currency: "UZS"`. The
   design says `сум`. The panel renders a fixed `сум` for v1 — UZS → `сум` is
   a mapping, not a formatting call, and there is no second currency in this
   product. Revisit when one exists.
2. ~~Effect window filter.~~ **Resolved by the backend spec: all-time, no
   range control in v1.** Don't build a date filter here.
3. ~~Summary block on the list response.~~ **Resolved by the backend spec:**
   `GET /internal/promo` returns `summary {totals, live_count,
purchases_count, bonus_paid}` computed over the whole filtered set in the
   same statement as the rows. The tiles read from `summary`, never from the
   loaded page.
4. **Restore vs. re-add after delete — needs a product answer.** The backend
   soft-deletes, so a deleted product's ИКПУ rows and effect stats survive,
   but the operator has no way back to it. Now that delete is the _only_
   off-switch, this matters more than it did when a toggle existed. Blocked
   on the backend spec's own open question 3 — if the answer is «Восстановить»,
   this panel needs a `include_deleted` filter and a row action.
5. ~~Date pickers.~~ **Resolved:** there is no `DatePicker` in
   `@gravity-ui/uikit`; use a native `<input type="date">`. See §5.

## DoD (definition of done)

- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` clean —
      the three runs CI actually executes (`.circleci/config.yml`, mirrored by
      `make check`).
- [ ] `npm run build` succeeds. Note this is a **separate** CI job
      (`build-and-push-docker-image`), not part of the lint job — run it
      locally.
- [ ] `Промо-товары` appears in the **main** nav group, is not dimmed, has
      no `· скоро` tooltip, and is the last item in the group.
- [ ] `/promo` renders a real table; no `ComingSoon` on the route.
- [ ] `TransactionsSoonPage` is gone from `src/pages/soon/SoonPages.tsx` and
      nothing imports it.
- [ ] Add flow works end to end against `npm run dev:mock`: search catalog
      → pick a drug → form opens pre-filled with its packages and reference
      price → save → row appears in the list **and is live immediately**
      (no second click, no enable switch).
- [ ] Edit flow sends a **partial** body: an unchanged field left at its
      default in the form does not blank the stored value on the server.
- [ ] `PUT` works through the new `api.put` — `npm run typecheck` proves the
      method exists and is wired; verify against the mock, not only the mock's 404.
- [ ] «Действует до» refuses a past date in the form, and the Действует до
      column shows «бессрочно» for a null `ends_at`.
- [ ] A product past its `ends_at` renders the «Завершён» badge, and its
      Switch is **on** (`status: 100`) — the deadline is not the operator's
      switch, and conflating the two would report a finished promo as running.
- [ ] **The Switch works and is honest.** Toggling it off calls
      `PATCH /internal/promo/{id}/status` with `{"status": 200}`, the row flips
      without a page reload, and the «Действует» tile drops by one. With the
      backend running, the product is then **absent from
      `GET /v1/products-promo`** and `GET /v1/products-promo/{id}` answers 404.
- [ ] A failed pause rolls the Switch back and shows a danger toaster with
      `errorText(e)` — force it by switching a row that was deleted in another
      tab, so the server answers 404.
- [ ] `status` is absent from `UpdatePromoRequest`: editing a product's bonus
      does not silently resume one that was paused, and does not silently
      pause one that was live.
- [ ] «Выключен» appears in `src/lib/constants.ts` and nowhere else, and the
      badge is derived from `is_live`, not re-derived from `status` in the
      component.
- [ ] `mock/server.mjs` serves the pause, and `npm run dev:mock` can pause and
      resume a product offline.
- [ ] ИКПУ multi-select refuses to submit with zero selected, in the form
      and not only server-side.
- [ ] Delete asks for confirmation, soft-deletes, and the row leaves the list.
- [ ] Every new backend alias appears in `src/lib/errors.ts`; confirmed by
      forcing one server error per alias and seeing Russian text, never
      English. Force at least one **400** — that is the only status where a
      missing alias leaks the raw backend message.
- [ ] No amount renders as tiyns: `2 000 сум`, never `2 000 000 сум`.
- [ ] The `EFFECT_CAVEAT` line is visible on the page — verified by reading
      the rendered screen, not by grepping for the string.
- [ ] `mock/server.mjs` serves all 8 new routes, every error response carries
      an `alias`, and a **404** case for an unknown `nomenclature_id` exists
      so the error path is demoable.
- [ ] `CLAUDE.md:89` names only Апселл, Смена продукта and Акции 5+1 as
      «Скоро» — not Overview, not Transactions, not Promo.
- [ ] Only two new CSS classes (`.catalog-row`, `.product-cell`); the page
      wrapper reuses `.panel`; no third-party dependency added.
- [ ] Branch: the panel's own history uses dots — `IT-10508.promo-products`
      — matching `IT-10567.notifications`. Commit subjects `IT-10508: …`.

## Log

- 13.10: spec created after Mirobidjon confirmed three decisions — keep
  `service-nomenclatures` live for enrichment **and** add paginated list +
  get-by-id catalog APIs; derive «Эффект» from local `receipt_items`; add
  `max_price` + `end_date` to the mobile contract with `is_new` operator-set.
- 13.10: repo scanned rather than assumed —
  - `src/app/nav.ts:47` already carries `Промо-товары` with `soon: true`,
    as the **first** item of `NAV_SOON`; `App.tsx:57` routes it to
    `PromoSoonPage`. Shipping this is a move, not a new entry.
  - The stub's own copy («Берутся из каталога») is why the flow is
    picker-first. A free-form product form would contradict the promise the
    stub already makes to operators.
  - No form library, no zod, no test runner, no codegen, **no `DatePicker`**
    in `@gravity-ui/uikit` — validation stays "throw inside `mutationFn`",
    types stay hand-written, dates stay native inputs.
  - `src/lib/errors.ts` turns a missing alias into raw English on a Russian
    panel — but only for statuses it has no arm for (400/409/422), which is
    exactly where the new validation aliases land.
  - `mock/server.mjs` is a supported dev workflow, so the promo branch ships
    with the page.
  - Branch naming: panel history uses `IT-10567.notifications` (dots) while
    the backend documents slashes. Follow the panel's own dots here and note
    the divergence rather than silently mixing.
- 13.10: two open questions were raised as blocking (the effect date filter
  and the list `summary` shape) and **resolved in the backend spec** the same
  day rather than left dangling: all-time stats, and a `summary` computed
  over the filtered set so the tiles cannot read as page-derived.
- 13.10: **spec review** found and folded in —
  - `api.put` does not exist (`client.ts:193-203`); the spec now adds it as a
    single method rather than silently switching the backend to PATCH.
    `PUT` is kept per Mirobidjon.
  - the invented `qs` helper was redundant — `buildUrl` (`client.ts:77-87`)
    already drops empty values, and all four existing list modules pass a
    plain object.
  - `DatePicker` does not exist in `@gravity-ui/uikit`; resolved with a
    native `<input type="date">`.
  - `toaster` is not ambient — all ten call sites use `useToaster()`; the
    mutation snippets now do too.
  - `withTableActions` is a wrapped component, not a per-column hook.
  - `ReceiptsPage` lives at `src/pages/receipts/ReceiptsPage.tsx`; the spec
    cited the wrong path four times.
  - `.page` does not exist in `theme.css` — only `.page-header`; the page
    wrapper reuses `.panel` so the two-class CSS cap holds.
  - `CLAUDE.md:89` was already wrong about Overview and Transactions; the fix
    is now whole-line, not Promo-only.
  - `errorText()`'s fallback order was misstated; the corrected version names
    400/409/422 as the leaking statuses.
- 13.10: **Mirobidjon's four decisions applied** — `PUT` kept; `starts_at`
  dropped (so the «Начало» field, the window validation, and the
  `DatePicker` question all go); **status only**, so a separate `is_active`
  column and a dedicated pause route are gone, delete is the only off-switch,
  the table's `Switch` becomes a read-only badge, the «Активных» tile becomes
  «Действует» off `summary.live_count`, and the optimistic-toggle code is
  deleted entirely; and `/internal/nomenclatures` moves to its own transport
  and service package on the backend.
- 13.10: because delete is now the only off-switch, «restore vs. re-add» is
  promoted to a blocking open question on both sides.
- 13.10 (later, same day): **Mirobidjon reviewed the built page and asked for
  the switch back** — «change the status promo products from admin panel, and
  show only active products on mobile». This reverses the «status only»
  decision above, so the spec is amended rather than quietly contradicted:
  - **No new column.** An `is_active` boolean was built first and then
    rejected in favour of the existing `status` column, per Mirobidjon. The
    panel therefore sends `{"status": 200}` / `{"status": 100}`.
  - `promoApi.setStatus` added, calling the backend's
    `PATCH /internal/promo/{id}/status`. `api.patch` already existed
    (`client.ts:195`), so **the fetch layer still needs no change** — the
    single-method addition to `client.ts` stays `put`, exactly as §3 says.
  - The status column becomes a `Switch` **plus** a badge, because `status`
    and `is_live` are genuinely different facts; §5 carries the truth table.
  - `statusLabel` gains a third state and takes `status` as well.
  - `status` is deliberately kept off `UpdatePromoRequest` — see §5's
    optimistic-update note for why two writers to one field is the risk.
  - `promo.admin.invalid_status` added to `src/lib/errors.ts`, so a refused
    status never surfaces the raw English backend message on a 400.
  - «Активен» is **not** added to the create/edit form: the table's Switch is
    the one control for it.
  - Delete keeps its confirmation dialog and its «нельзя вернуть» warning.
    That warning is still true — the switch is not a restore path.
