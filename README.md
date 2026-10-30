# Pulso · панель оператора

Internal dashboard for the Pulso cashback app. React 19 + Vite + TypeScript, UI on [Gravity UI](https://github.com/gravity-ui/uikit) themed after Yandex ID / Yandex 360: grey workspace, white content sheet, near-black primary action, grey pill navigation (`src/theme.css`).

## Run

```sh
npm install
cp .env.example .env   # optional; defaults work for development
npm run dev            # http://localhost:5173
```

In development Vite proxies `/internal/*` and `/v1/*` to `VITE_API_PROXY_TARGET` (defaults to `https://api.pulso.dorim.com`), so no CORS setup is needed. For a production build set `VITE_API_BASE` to the API origin or serve the bundle behind the same host.

```sh
npm run build          # typecheck + bundle to dist/
npm run preview
npm run lint           # oxlint
npm run format         # prettier --write (config in .prettierrc.json)
npm run format:check
```

То же самое через `make` (обёртка над npm-скриптами):

```sh
make help              # список целей
make check             # lint + format:check + typecheck — ровно то, что гоняет CI
make lint              # только oxlint
make format-check      # только prettier --check
make format            # prettier --write
make lint-fix          # oxlint --fix
make build             # сборка в dist/
```

## What's wired to the API

| Section                     | Endpoints                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Вход / выход / смена пароля | `POST /internal/auth/login`, `GET /internal/auth`, `POST /internal/auth/refresh`, `POST /internal/auth/logout`, `POST /internal/auth/password`                                                                            |
| Уведомления                 | `GET/POST /internal/notifications`, `GET/PATCH/DELETE /internal/notifications/{id}`, `POST /internal/push/send`                                                                                                           |
| Опросы                      | `GET/POST /internal/surveys`, `GET/PUT/DELETE /internal/surveys/{id}`, `PATCH /internal/surveys/{id}/status`, `GET /internal/surveys/{id}/responses[/{sid}]`, `GET /internal/surveys/{id}/stats`, `POST /internal/upload` |
| Пользователи                | `GET /internal/users`, `GET /internal/users/{id}`, `PATCH /internal/users/{id}/status`                                                                                                                                    |
| Версии приложения           | `GET/POST /internal/versions`, `DELETE /internal/versions/{platform}`                                                                                                                                                     |
| Перевод кешбэка             | `POST /internal/receipts/promote-pending`                                                                                                                                                                                 |

Аналитика reads the mobile app's PostHog project through the Worker (see «Mobile app analytics» below). There are no placeholder sections: what is not built is not in the navigation.

## Блокировка пользователя

Статус меняется на карточке пользователя (`Заблокировать` / `Разблокировать`, с подтверждением). Блокировка на backend:

- запрещает вход — и в приложение, и в админку; номер телефона отвечает тем же, что несуществующий, поэтому перебором её не проверить;
- закрывает все живые сессии пользователя (телефон и админка), поэтому открытое приложение выходит из аккаунта при следующем запросе, а не по истечении токена. Число закрытых сессий показывается в подтверждении;
- обратима: разблокировка возвращает доступ, но закрытые сессии не восстанавливаются — пользователь входит заново.

`Удалён` — это мягкое удаление, вернуть из него нельзя; в панели этот статус только показывается.

## Публичная страница опроса `/s/:id`

The mobile app opens surveys in a WebView at `<admin host>/s/<id>#token=<mobile access JWT>&lang=ru|uz|uzCyrl[&theme=dark]`. The page is rendered by `src/public/*` outside the admin shell: it never reads or writes the admin session, keeps the token in memory only, and calls the mobile API (`GET /v1/surveys/{id}`, `POST /v1/surveys/{id}/submit`, `POST /v1/upload`) with `Authorization: Bearer <token>` through the same `/v1/*` proxy. The form schema, condition grammar and answer validation live in `src/surveys/schema.ts` and mirror the backend byte-for-byte; the same `SurveyRunner` renders the live preview inside the editor.

Messages the page posts to the app via `window.ReactNativeWebView.postMessage(JSON.stringify(msg))` (`src/public/bridge.ts`):

| `type`                 | Payload                                                       | When                                                  |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| `survey_ready`         | `survey_id`                                                   | Survey loaded                                         |
| `survey_completed`     | `survey_id, submission_id, credited, reward_amount`           | Right after a successful submit — refresh the balance |
| `survey_close`         | `survey_id, reason: done\|already_completed\|blocked\|cancel` | User tapped «Вернуться в приложение»                  |
| `survey_open_url`      | `url`                                                         | A PDF/image slide should open outside the WebView     |
| `survey_token_expired` | `survey_id`                                                   | API answered 401 — reopen the page with a fresh token |

Without a bridge (desktop browser) the return button navigates to `VITE_PULSO_DEEP_LINK` (default `pulso://polls`).

## Layout

- `src/api` — typed client with bearer auth and single-flight refresh, one module per API area.
- `src/auth` — session context (login, logout, expiry).
- `src/app` — shell, sidebar navigation, routes, theme toggle.
- `src/pages` — one folder per section (`surveys/editor` is the question builder, `surveys/responses` the stats).
- `src/surveys` — form schema, condition engine, validation, respondent strings and the `SurveyRunner` renderer shared by the editor preview and the public page.
- `src/public` — the `/s/:id` respondent page: fragment token, thin mobile-API client, WebView bridge.
- `src/components` — page header, confirm dialog, states, field wrapper.
- `src/lib` — formatting (сум, Tashkent time, plurals), constants, error text.
- `.agents/skills/gravity-ui` — the Gravity UI agent skill (`npx skills add gravity-ui/skills`).
- `.agents/skills/ux-laws` — UX heuristics skill used for layout and flow decisions (`npx skills add uwussimo/ux-laws`).

Notification type labels (Начисление, Статус, Напоминание, Промо, Системное) mirror the backend's `dto.NotificationType` constants and live in `src/lib/constants.ts`.

## Mobile app analytics on Обзор

The «Приложение» block reads the mobile app's PostHog project (US Cloud, project 675346) through `/metrics/app`, served by `worker/metrics.js`. The browser never talks to PostHog: the handler checks the caller's operator session against `/internal/auth`, runs a fixed set of HogQL queries with a personal API key, and returns one JSON. Without a key the block says «не подключена» and shows no numbers.

- Locally: put a personal API key with the `query:read` scope into `.env` as `POSTHOG_API_KEY` (no `VITE_` prefix, so it never enters the bundle). The Vite dev server serves the same handler.
- Production: `npx wrangler secret put POSTHOG_API_KEY`. `POSTHOG_PROJECT_ID` and `POSTHOG_HOST` are plain vars in `wrangler.jsonc`.

## Deploying to Cloudflare

The project deploys as a Cloudflare Worker with static assets (`wrangler.jsonc`). Build command `npm run build`, deploy command `npx wrangler deploy`.

- `assets.not_found_handling: single-page-application` serves `index.html` for client-side routes.
- `worker/index.js` runs only for `/internal/*` and `/v1/*` and proxies to the API, so the browser stays same-origin and no CORS is needed. Change the upstream with the `API_ORIGIN` variable in `wrangler.jsonc` or the dashboard; it defaults to `https://api.pulso.dorim.com`.

Leave `VITE_API_BASE` empty for this setup. Local check: `npm run build && npx wrangler dev`.

## Docker / Kubernetes (prod)

`Dockerfile` builds the bundle and serves it with nginx on port `8080` (`nginx/default.conf.template`): SPA fallback, long cache for `/assets/`, `/healthz` for probes, and `/internal/*` proxied to `API_ORIGIN` (default `https://api.pulso.dorim.com`, no trailing slash) the same way `worker/index.js` does.

```sh
docker build -t pulso-admin . && docker run --rm -p 8080:8080 pulso-admin
```

`.circleci/config.yml` lints every branch; on `main` it then pushes `1.<pipeline>-main` and `latest` to the prod ECR repo `pulso-admin` (contexts `github-main`, `aws-main`). argocd-image-updater in `dorim-group/gitops` rolls out the newest `N.N-main` tag.

## Mock API for local development

`mock/server.mjs` is a dependency-free stand-in for the operator API (plus the mobile `/v1/surveys` slice) with seeded notifications, users, versions and four surveys, one per status. Run it in one terminal and point the dev server at it in another:

```sh
npm run mock       # http://localhost:8787
npm run dev:mock   # Vite with /internal/* proxied to the mock
```

Sign in with phone `+998901234567` and password `password12` (mock only).

Public survey page against the mock: `http://localhost:5173/s/3#token=mobile-test&lang=ru` (fresh user), `#token=mobile-done` (already completed), `/s/1#token=mobile-test` (draft → not found), no fragment → «Откройте опрос из приложения».
