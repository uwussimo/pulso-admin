# Pulso · панель оператора

Internal dashboard for the Pulso cashback app. React 19 + Vite + TypeScript, UI on [Gravity UI](https://github.com/gravity-ui/uikit) themed after Yandex ID / Yandex 360: grey workspace, white content sheet, near-black primary action, grey pill navigation (`src/theme.css`).

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
npm run lint           # oxlint
npm run format         # prettier --write (config in .prettierrc.json)
npm run format:check
```

## What's wired to the API

| Section                     | Endpoints                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Вход / выход / смена пароля | `POST /internal/auth/login`, `GET /internal/auth`, `POST /internal/auth/refresh`, `POST /internal/auth/logout`, `POST /internal/auth/password` |
| Уведомления                 | `GET/POST /internal/notifications`, `GET/PATCH/DELETE /internal/notifications/{id}`, `POST /internal/push/send`                                |
| Пользователи                | `GET /internal/users`, `GET /internal/users/{id}`, `PATCH /internal/users/{id}/status`                                                         |
| Версии приложения           | `GET/POST /internal/versions`, `DELETE /internal/versions/{platform}`                                                                          |
| Перевод кешбэка             | `POST /internal/receipts/promote-pending`                                                                                                      |

Everything else (Обзор metrics, Транзакции, Промо, Апселл, Смена продукта, Акции 5+1, журнал действий, операторы) is shown as «Скоро» with a description and no numbers.

## Блокировка пользователя

Статус меняется на карточке пользователя (`Заблокировать` / `Разблокировать`, с подтверждением). Блокировка на backend:

- запрещает вход — и в приложение, и в админку; номер телефона отвечает тем же, что несуществующий, поэтому перебором её не проверить;
- закрывает все живые сессии пользователя (телефон и админка), поэтому открытое приложение выходит из аккаунта при следующем запросе, а не по истечении токена. Число закрытых сессий показывается в подтверждении;
- обратима: разблокировка возвращает доступ, но закрытые сессии не восстанавливаются — пользователь входит заново.

`Удалён` — это мягкое удаление, вернуть из него нельзя; в панели этот статус только показывается.

## Layout

- `src/api` — typed client with bearer auth and single-flight refresh, one module per API area.
- `src/auth` — session context (login, logout, expiry).
- `src/app` — shell, sidebar navigation, routes, theme toggle.
- `src/pages` — one folder per section.
- `src/components` — page header, confirm dialog, states, field wrapper.
- `src/lib` — formatting (сум, Tashkent time, plurals), constants, error text.
- `.agents/skills/gravity-ui` — the Gravity UI agent skill (`npx skills add gravity-ui/skills`).
- `.agents/skills/ux-laws` — UX heuristics skill used for layout and flow decisions (`npx skills add uwussimo/ux-laws`).

Notification type labels (Начисление, Статус, Напоминание, Промо, Системное) mirror the backend's `dto.NotificationType` constants and live in `src/lib/constants.ts`.

## Deploying to Cloudflare

The project deploys as a Cloudflare Worker with static assets (`wrangler.jsonc`). Build command `npm run build`, deploy command `npx wrangler deploy`.

- `assets.not_found_handling: single-page-application` serves `index.html` for client-side routes.
- `worker/index.js` runs only for `/internal/*` and proxies to the operator API, so the browser stays same-origin and no CORS is needed. Change the upstream with the `API_ORIGIN` variable in `wrangler.jsonc` or the dashboard; it defaults to `https://api.pulso.dorim.com`.

Leave `VITE_API_BASE` empty for this setup. Local check: `npm run build && npx wrangler dev`.

## Docker / Kubernetes (prod)

`Dockerfile` builds the bundle and serves it with nginx on port `8080` (`nginx/default.conf.template`): SPA fallback, long cache for `/assets/`, `/healthz` for probes, and `/internal/*` proxied to `API_ORIGIN` (default `https://api.pulso.dorim.com`, no trailing slash) the same way `worker/index.js` does.

```sh
docker build -t pulso-admin . && docker run --rm -p 8080:8080 pulso-admin
```

`.circleci/config.yml` lints every branch; on `main` it then pushes `1.<pipeline>-main` and `latest` to the prod ECR repo `pulso-admin` (contexts `github-main`, `aws-main`). argocd-image-updater in `dorim-group/gitops` rolls out the newest `N.N-main` tag.

## Mock API for local development

`mock/server.mjs` is a dependency-free stand-in for the operator API with a few seeded notifications and versions. Run it in one terminal and point the dev server at it in another:

```sh
npm run mock       # http://localhost:8787
npm run dev:mock   # Vite with /internal/* proxied to the mock
```

Sign in with phone `+998901234567` and password `password12` (mock only).
