# Deploy Tradel

**Backend + Postgres on Heroku (GitHub Student Pack credits). Frontend on
Vercel (free forever, best Next.js host).**

| Piece    | Platform | Note                                          |
| -------- | -------- | --------------------------------------------- |
| Database | Heroku Postgres add-on | Managed, SSL, no sleep          |
| Backend  | Heroku dyno | Student credits → no sleep, no cold start   |
| Frontend | Vercel   | Free, no sleep                                 |

> Frontend & backend live on different domains → the refresh cookie must cross
> sites. Already handled in code (`sameSite: 'none'` + `secure` in prod).

---

## Code changes already made (deploy-ready)

All type-check clean.

1. **`frontend/src/lib/api.ts`** — base URL reads `NEXT_PUBLIC_API_URL`
   (falls back to `localhost:3000` in dev).
2. **`backend/src/auth/auth.controller.ts`** — refresh cookie is
   `sameSite: 'none'` + `secure` in prod, `strict` in dev.
3. **`backend/src/database/database.service.ts`** — prod pool uses
   `connectionString: DB_URL` + `ssl` (Heroku PG requires SSL); dev keeps
   discrete `DB_*` vars.
4. **`backend/src/config/env.validation.ts`** — discrete `DB_*` vars optional;
   maps Heroku's `DATABASE_URL` → `DB_URL`.
5. **`backend/Procfile`** — `release` runs migrations (SSL on), `web` starts
   the server.
6. **`backend/package.json`** — pinned `engines.node = 22.x`.

Push these first. Currently on branch `feat/notes` — merge to `master` first
(Heroku deploys a branch; `master` is cleanest).

---

## 1. Backend + Database — Heroku

Heroku app root must be `backend/`, but the git repo root is the monorepo. Two
clean ways — pick one:

### Option A — subdir buildpack (deploy from monorepo, no repo changes)

```bash
# install Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli
heroku login

# create the app
heroku create tradel-api

# tell Heroku the app lives in backend/
heroku buildpacks:add -a tradel-api https://github.com/timanovsky/subdir-heroku-buildpack
heroku buildpacks:add -a tradel-api heroku/nodejs
heroku config:set -a tradel-api PROJECT_PATH=backend

# managed Postgres (creates DATABASE_URL automatically)
heroku addons:create -a tradel-api heroku-postgresql:essential-0

# app config
heroku config:set -a tradel-api NODE_ENV=production
heroku config:set -a tradel-api JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
heroku config:set -a tradel-api JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
# FRONTEND_URL is set after the Vercel deploy (step 3)

# deploy (release phase runs migrations, then web boots)
git push heroku master
```

> `essential-0` is a paid ($5/mo) plan but covered by student credits and is
> the smallest always-on tier. The old free `hobby-dev` plan is retired.

Backend URL: `https://tradel-api-xxxx.herokuapp.com`

### Option B — Heroku dashboard (GitHub connect)

1. [dashboard.heroku.com](https://dashboard.heroku.com) → **New → Create new app**
   → name `tradel-api`.
2. **Deploy** tab → connect GitHub repo `2iaad/tradel` → branch `master`.
3. **Settings → Buildpacks** → add
   `https://github.com/timanovsky/subdir-heroku-buildpack` **first**, then
   `heroku/nodejs`.
4. **Settings → Config Vars:**
   ```
   PROJECT_PATH=backend
   NODE_ENV=production
   JWT_ACCESS_SECRET=<openssl rand -hex 32>
   JWT_REFRESH_SECRET=<openssl rand -hex 32>
   ```
5. **Resources** → add-ons → search `Heroku Postgres` → plan `essential-0`.
   (Injects `DATABASE_URL` automatically.)
6. **Deploy** tab → Deploy Branch. Release phase runs migrations.

Migrations run automatically via the `Procfile` `release:` line — no manual
migrate step needed.

---

## 2. Frontend — Vercel

1. [vercel.com](https://vercel.com) → sign up → **Add New → Project** →
   import `2iaad/tradel`.
2. **Root Directory:** `frontend`. Framework auto-detects Next.js.
3. **Environment variable:**
   ```
   NEXT_PUBLIC_API_URL=https://tradel-api-xxxx.herokuapp.com
   ```
   (Heroku backend URL — no trailing slash, no `/api`.)
4. Deploy. URL, e.g. `https://tradel.vercel.app`.

---

## 3. Close the loop

```bash
heroku config:set -a tradel-api FRONTEND_URL=https://tradel.vercel.app
```
(or set it in the dashboard Config Vars — triggers a redeploy, fixes CORS.)

Open `https://tradel.vercel.app` → register → login. Works.

---

## Later — GoDaddy domain

- **Vercel:** Project → Domains → add `tradel.com` → set GoDaddy DNS per
  Vercel's instructions.
- **Heroku:** `heroku domains:add -a tradel-api api.tradel.com` → add the DNS
  target to GoDaddy. (Custom domain SSL needs a paid dyno — student credits
  cover it.)
- Update `NEXT_PUBLIC_API_URL` (Vercel) + `FRONTEND_URL` (Heroku) to the custom
  domains. Cookie `sameSite: 'none'` still works.

---

## Not done yet (optional)

- `.env.example` doesn't document `NEXT_PUBLIC_API_URL` / `FRONTEND_URL`.
- Shared-parent-domain cookie (`sameSite: lax`, `Domain=.tradel.com`) — better
  security, needs the domain first.
