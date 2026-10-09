# Pulso · панель оператора

Internal dashboard for the Pulso cashback app. React 19 + Vite + TypeScript, UI on [Gravity UI](https://github.com/gravity-ui/uikit) themed after Yandex ID / Yandex 360: grey workspace, white content sheet, yellow primary action, grey pill navigation (`src/theme.css`).

## Run

```sh
npm install
cp .env.example .env   # optional; defaults work for development
npm run dev            # http://localhost:5173
```

In development Vite proxies `/internal/*` to `VITE_API_PROXY_TARGET` (defaults to `https://api.pulso.dorim.com`), so no CORS setup is needed. For a production build set `VITE_API_BASE` to the API origin or serve the bundle behind the same host.

```sh
npm run build          # typecheck + bundle to dist/
npm run preview
```

## What's wired to the API

| Section | Endpoints |
| --- | --- |
| Вход / выход / смена пароля | `POST /internal/auth/login`, `GET /internal/auth`, `POST /internal/auth/refresh`, `POST /internal/auth/logout`, `POST /internal/auth/password` |
| Уведомления | `GET/POST /internal/notifications`, `GET/PATCH/DELETE /internal/notifications/{id}`, `POST /internal/push/send` |
| Версии приложения | `GET/POST /internal/versions`, `DELETE /internal/versions/{platform}` |
| Перевод кешбэка | `POST /internal/receipts/promote-pending` |

Everything else (Обзор metrics, Транзакции, Пользователи, Промо, Апселл, Смена продукта, Акции 5+1, журнал действий, операторы) is shown as «Скоро» with a description and no numbers.

## Layout

- `src/api` — typed client with bearer auth and single-flight refresh, one module per API area.
- `src/auth` — session context (login, logout, expiry).
- `src/app` — shell, sidebar navigation, routes, theme toggle.
- `src/pages` — one folder per section.
- `src/components` — page header, confirm dialog, states, field wrapper.
- `src/lib` — formatting (сум, Tashkent time, plurals), constants, error text.
- `.agents/skills/gravity-ui` — the Gravity UI agent skill (`npx skills add gravity-ui/skills`).
- `.agents/skills/ux-laws` — UX heuristics skill used for layout and flow decisions (`npx skills add uwussimo/ux-laws`).

Notification type codes 100–500 are not named by the backend; labels live in `src/lib/constants.ts`.

## Mock API for local development

`mock/server.mjs` is a dependency-free stand-in for the operator API with a few seeded notifications and versions. Run it in one terminal and point the dev server at it in another:

```sh
npm run mock       # http://localhost:8787
npm run dev:mock   # Vite with /internal/* proxied to the mock
```

Sign in with phone `+998901234567` and password `password12` (mock only).
