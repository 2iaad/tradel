# Tradel — What's Left (Phase 1)

Backend done: auth, accounts (full CRUD), trades (full CRUD), notes (full CRUD).
Gaps are **frontend wiring** + **quality net**. Order below is dependency-correct.

Conventions (reuse, don't reinvent):
- state → zustand stores in `frontend/src/stores/`, actions do the API calls
- http → `frontend/src/lib/api.ts` (`api`, `apiMessage`) — 401 refresh-retry already handled
- styling → `frontend/src/lib/ui.ts` (`inputCls`, `btnCls`, `cardCls`, `ctaCls`, `G`, `R`, …)
- format → `frontend/src/lib/format.ts` (`signedMoney`, `emailFromToken`)
- backend → Controller → Service → Repository, raw SQL via `DatabaseService.query`, scope every query by `req.user.sub`
- ⚠ before writing frontend code, read `frontend/node_modules/next/dist/docs/` (Next.js differs from training data)

---

## [x] 1. Multi-account (do first — unblocks the rest)  ✅ DONE

- [x] `stores/accounts.ts` — new. `{ accounts, activeId, loading, error }` + actions:
  - `load()` → `GET /accounts`; pick `activeId` (persisted ∈ list, else `accounts[0]`)
  - `create(dto)` → `POST /accounts`, refresh list, set active = new id
  - `rename(id, name)` → `PATCH /accounts/:id`, refresh
  - `remove(id)` → `DELETE /accounts/:id`, refresh, re-point active if it was removed
  - `setActive(id)` → write `localStorage`
- [x] persist `activeId` in `localStorage` (one-liner, no server column)
- [x] `stores/trades.ts` — edit: delete the `accountId` field + the lazy `POST /accounts {name:'Main'}` in `saveTrade`; read active id from `useAccountStore.getState().activeId`; no-op when null
- [x] re-run trades `load()` whenever `activeId` changes (store `subscribe`)
- [x] account picker in sidebar — dropdown of accounts, active highlighted, `+ New account`
- [x] real account-create form — `account-modal.tsx` (name / broker / currency). NOTE: `create-account-modal.tsx` was the misnamed guest signup form, left untouched
- [x] rename + delete-with-confirm (`DeleteAccountModal`)
- [x] settings page (`dashboard/settings/page.tsx`) — account list + rename/delete
- [x] empty state when no accounts (reuse `cardCls` + `ctaCls`)
- [x] verified: `tsc` + `lint` + `next build` all pass (not yet clicked through in a running browser)

## [x] 2. Notes / journal UI  ✅ DONE

- [x] `stores/notes.ts` — new. `{ notes, loading, error }` + actions (active id from `useAccountStore`):
  - `load()` → `GET /accounts/:activeId/notes`
  - `create(tradeId, dto)` → `POST /accounts/:activeId/trades/:tradeId/notes`
  - `update(id, dto)` → `PATCH /accounts/:activeId/notes/:id`
  - `remove(id)` → `DELETE /accounts/:activeId/notes/:id`
  - reload on `activeId` change (store `subscribe`)
- [x] journal page (`dashboard/journal/page.tsx`) — note cards (title, body, tag chips, date, trade symbol)
- [x] filters client-side: text search + tag
- [x] note edit form + tag input (space-separated). NOTE: create happens from a trade row, not the journal — no trade `<select>` (journal is edit-only)
- [x] delete-with-confirm
- [x] empty state
- [x] trade ↔ note link: note dot in `trade-row.tsx` + "＋ note" action pre-scoped to that trade; join notes by `trade_id` on the client (no new endpoint)
- [x] verified: `tsc` + `lint` + `next build` all pass (not yet clicked through in a running browser)

## [ ] 3. Analytics + calendar + equity

- [ ] backend `src/analytics/` — new module (Controller → Service → Repository, `@UseGuards(JwtGuard)`, scope by `req.user.sub` + `accountId`):
  - `GET /accounts/:accountId/analytics/summary` → net P&L, win rate, profit factor, expectancy, avg R, counts
  - `GET /accounts/:accountId/analytics/equity` → cumulative P&L series (order by `closed_at`)
  - `GET /accounts/:accountId/analytics/calendar?month=` → daily `{date, pnl, trades}`
  - `GET /accounts/:accountId/analytics/breakdown?by=symbol|side`
  - guard divide-by-zero (no closed trades → null/`—`, not `NaN`)
- [ ] register `AnalyticsModule` in `app.module.ts` + copy the `JwtModule.registerAsync` block from `AccountsModule` (guard needs `JwtService`)
- [ ] `stores/analytics.ts` — thin store, fetch per `activeId`, reload on change
- [ ] analytics page — stat cards (reuse `dashboard/page.tsx` `StatCards`) + equity curve + breakdown bars
- [ ] calendar page — month grid, cells tinted `G`/`R` by daily P&L, prev/next month
- [ ] equity — reuse `dashboard/equity-chart.lib.ts` / `equity-card.tsx`, feed `/analytics/equity`
- [ ] migrate `use-dashboard-data.ts` to read `/analytics/summary` (one source of truth)
- [ ] verify: seed deterministic trades → numbers match hand-computed → switch account/month updates all

## [ ] 4. Auth hardening

- [ ] refresh-token rotation: `/auth/refresh` issues new token + revokes old in ONE transaction (`BEGIN/COMMIT`)
- [ ] reuse detection: refresh with already-revoked hash → revoke whole family + reject
- [ ] migration: add session metadata cols (user-agent, ip) to `refresh_tokens`
- [ ] password reset: migration `password_reset_tokens` (hashed, short `expires_at`) + `POST /auth/forgot` + `POST /auth/reset`; log reset link to console (no mailer yet), wire `(auth)/reset/page.tsx`
- [ ] route protection: redirect `guest` from `/dashboard/*` to `/login` (session store status)
- [ ] rate-limit `/auth/login` `/auth/forgot` `/auth/refresh` with `@nestjs/throttler`
- [ ] verify: refresh rotates cookie; replay old token revokes family; reset link expires; login throttled

## [ ] 5. Tests + CI

- [ ] backend unit (Jest): analytics math (profit factor, expectancy, avg R, divide-by-zero); auth rotation + reuse
- [ ] backend integration (Supertest): ownership isolation (user A can't touch user B's account/trade/note); auth flow
- [ ] dedicated Postgres test DB, migrations applied, deterministic seed
- [ ] frontend Playwright: account switch + CRUD, note CRUD + filter, login→dashboard→logout
- [ ] CI (GitHub Actions): lint → type-check → migrate:up → jest+supertest → build → playwright; Postgres service container
- [ ] `GET /api/health` route + `nestjs-pino` structured logging

## [ ] Housekeeping (as you go)

- [ ] fix `CLAUDE.md` — says accounts `findOne/update/remove` are stubs + no trades/notes module. All shipped. Add Trades/Notes/Analytics sections.
- [ ] swap hardcoded `http://localhost:3000/api` in `lib/api.ts` for `NEXT_PUBLIC_API_URL`
- [ ] add new env vars to `.env.example` + `env.validation.ts` (throttler, mailer, `NEXT_PUBLIC_API_URL`)
