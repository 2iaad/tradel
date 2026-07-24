# Tradel — What's Left

Done: auth, accounts/trades/notes (full CRUD, frontend wired), multi-account,
journal UI, equity curve (client-side, real data). Remaining below is
dependency-ordered.

Conventions (reuse, don't reinvent):
- state → zustand stores in `frontend/src/stores/`, actions do the API calls
- http → `frontend/src/lib/api.ts` (`api`, `apiMessage`) — 401 refresh-retry handled
- styling → `frontend/src/lib/ui.ts` (`inputCls`, `btnCls`, `cardCls`, `ctaCls`, `G`, `R`, …)
- format → `frontend/src/lib/format.ts` (`signedMoney`, `emailFromToken`)
- backend → Controller → Service → Repository, raw SQL via `DatabaseService.query`, scope every query by `req.user.sub`
- trades have one timestamp: `created_at` (no `opened_at`/`closed_at`) — order/group by it
- ⚠ before writing frontend code, read `frontend/node_modules/next/dist/docs/` (Next.js differs from training data)

---

## 1. Analytics + calendar

Backend-driven stats/breakdowns. Equity curve already ships client-side — no
`/analytics/equity` endpoint unless a server source-of-truth is wanted.

- [ ] backend `src/analytics/` module (Controller → Service → Repository, `@UseGuards(JwtGuard)`, scope by `req.user.sub` + `accountId`):
  - `GET /accounts/:accountId/analytics/summary` → net P&L, win rate, profit factor, expectancy, avg R, counts
  - `GET /accounts/:accountId/analytics/calendar?month=` → daily `{date, pnl, trades}`, grouped by `created_at`
  - `GET /accounts/:accountId/analytics/breakdown?by=symbol|side`
  - guard divide-by-zero (no closed trades → null/`—`, not `NaN`)
- [ ] register `AnalyticsModule` in `app.module.ts` + copy `JwtModule.registerAsync` from `AccountsModule` (guard needs `JwtService`)
- [ ] `stores/analytics.ts` — thin store, fetch per `activeId`, reload on change
- [ ] analytics page — stat cards (reuse `dashboard/page.tsx` `StatCards`) + equity curve + breakdown bars
- [ ] calendar page — month grid, cells tinted `G`/`R` by daily P&L (by `created_at`), prev/next month
- [ ] migrate `use-dashboard-data.ts` to read `/analytics/summary` (one source of truth)
- [ ] verify: seed deterministic trades → numbers match hand-computed → switch account/month updates all

## 2. Auth hardening

- [ ] refresh-token rotation: `/auth/refresh` issues new token + revokes old in ONE transaction (`BEGIN/COMMIT`)
- [ ] reuse detection: refresh with already-revoked hash → revoke whole family + reject
- [ ] migration: session metadata cols (user-agent, ip) on `refresh_tokens`
- [ ] password reset: migration `password_reset_tokens` (hashed, short `expires_at`) + `POST /auth/forgot` + `POST /auth/reset`; log reset link to console (no mailer yet), wire `(auth)/reset/page.tsx`
- [ ] route protection: redirect `guest` from `/dashboard/*` to `/login` (session store status)
- [ ] rate-limit `/auth/login` `/auth/forgot` `/auth/refresh` with `@nestjs/throttler`
- [ ] verify: refresh rotates cookie; replay old token revokes family; reset link expires; login throttled

## 3. Tests + CI

- [ ] backend unit (Jest): analytics math (profit factor, expectancy, avg R, divide-by-zero); auth rotation + reuse
- [ ] backend integration (Supertest): ownership isolation (user A can't touch user B's account/trade/note); auth flow
- [ ] dedicated Postgres test DB, migrations applied, deterministic seed
- [ ] frontend Playwright: account switch + CRUD, note CRUD + filter, login→dashboard→logout
- [ ] CI (GitHub Actions): lint → type-check → migrate:up → jest+supertest → build → playwright; Postgres service container
- [ ] `GET /api/health` route + `nestjs-pino` structured logging

## 4. Housekeeping

- [ ] `CLAUDE.md` — add Trades + Notes module sections (accounts section already current)
- [ ] swap hardcoded `http://localhost:3000/api` in `lib/api.ts` for `NEXT_PUBLIC_API_URL`
- [ ] add new env vars to `.env.example` + `env.validation.ts` (throttler, mailer, `NEXT_PUBLIC_API_URL`)
