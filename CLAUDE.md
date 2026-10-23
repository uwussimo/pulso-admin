# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal operator dashboard for the Pulso cashback app. React 19 + Vite + TypeScript, UI built on [Gravity UI](https://github.com/gravity-ui/uikit) themed after Yandex ID / Yandex 360. Deploys as a Cloudflare Worker with static assets.

## Agent Skills

Use all skills in `.agents/skills/` proactively for relevant work:

- `gravity-ui` — Gravity UI component usage and patterns
- `ux-laws` — UX heuristics for layout and flow decisions
- `yandex-ui` — Yandex UI design system guidance

## Commands

```sh
npm run dev            # http://localhost:5173
npm run build          # typecheck + bundle to dist/
npm run preview        # preview production build
npm run lint           # oxlint
npm run format         # prettier --write
npm run format:check
npm run typecheck      # tsc -b

# Mock API (separate terminal)
npm run mock           # http://localhost:8787 (mock API)
npm run dev:mock       # Vite with /internal/* proxied to mock
```

`.env` points `VITE_API_BASE` at the production API, so plain `npm run dev` talks to
`api.pulso.dorim.com`. `dev:mock` clears it and proxies `/internal/*` to the mock instead.

## Architecture

### API Layer (`src/api/`)

- Typed client with bearer auth and single-flight token refresh
- One module per API area: `auth.ts`, `users.ts`, `notifications.ts`, `versions.ts`, `receipts.ts`, `extrabenefit.ts`
- `client.ts` exports `api` (get/post/patch/delete helpers), `ApiError`, session helpers (`loadSession`, `saveSession`, `onSessionExpired`)
- Session stored in `localStorage` under `pulso-admin.session`

### Auth (`src/auth/`)

- `AuthContext` provides session state (loading/authenticated/anonymous)
- Wraps API client with auto-refresh on 401

### App Shell (`src/app/`)

- `AppShell.tsx` — sidebar + main content area layout
- `Sidebar.tsx` — collapsible rail navigation
- `nav.ts` — navigation config
- Theme toggle between light/dark via `AppTheme.tsx`

### Pages (`src/pages/`)

One folder per section. Each page is a route in `App.tsx`.

### Components (`src/components/`)

- `PageHeader.tsx` — page title + actions
- `ConfirmDialog.tsx` — confirmation modal
- `States.tsx` — loading/error/empty states
- `Field.tsx` — form field wrapper
- `ComingSoon.tsx` — stub for unimplemented sections
- `AudienceLabel.tsx` — notification audience badge

### Lib (`src/lib/`)

- `format.ts` — formatting (сум, Tashkent time, plurals)
- `constants.ts` — notification type labels matching backend `dto.NotificationType`
- `errors.ts` — error text constants

### Styling

- Gravity UI tokens overridden in `src/theme.css`
- Yandex ID / Yandex 360 aesthetic: grey workspace, white content sheet, near-black primary
- App-level tokens use `--app-*` prefix; Gravity tokens use `--g-*`

## API Endpoints Wired

| Section       | Endpoints                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /internal/auth/login`, `GET /internal/auth`, `POST /internal/auth/refresh`, `POST /internal/auth/logout`, `POST /internal/auth/password`      |
| Notifications | `GET/POST /internal/notifications`, `GET/PATCH/DELETE /internal/notifications/{id}`, `POST /internal/push/send`                                     |
| Users         | `GET /internal/users`, `GET /internal/users/{id}`, `PATCH /internal/users/{id}/status`                                                              |
| Versions      | `GET/POST /internal/versions`, `DELETE /internal/versions/{platform}`                                                                               |
| Cashback      | `POST /internal/receipts/promote-pending`                                                                                                           |
| Экстра-выгода | `GET/POST /internal/extra-benefit/offers`, `GET/PUT/DELETE /internal/extra-benefit/offers/{id}`, `PATCH /internal/extra-benefit/offers/{id}/status` |

All other sections (Апселл, Смена продукта) show "Скоро" (coming soon).

### Экстра-выгода (goal offers, IT-10739)

- `src/pages/extrabenefit/` — list, editor and the multilingual copy form
- The offer carries its own ИКПУ code list; codes the catalogue does not carry are typed in by hand and never rejected
- The operator list nests no product name — the backend returns only `nomenclature_id`, so the product is resolved once, in the editor
- `status` 100 is live, 200 paused; the badge also shows «Завершён» when the window has passed
- The operator's fields mirror the app's card field-for-field: what the card renders as the app's own copy (the how-it-works steps, the button label — the latter comes from the backend's AI summary) is not operator-authored, and `rules` is one block of text because the app shows one card

## Mock Credentials

Sign in with phone `+998901234567` and password `password12` (mock server only).

## Cloudflare Deployment

- `wrangler.jsonc` configures Worker for `/internal/*` API proxying
- `assets.not_found_handling: "single-page-application"` serves `index.html` for client-side routes
- Worker only runs for `/internal/*`; static assets served directly
- Build: `npm run build`, Deploy: `npx wrangler deploy`
- Local check: `npm run build && npx wrangler dev`
