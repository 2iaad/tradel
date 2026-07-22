# Preparing a project for production — what changed and why

Notes so next time you know what to fix **before** deploying. Local dev works on
one machine over `http://localhost`. Production is different: HTTPS, two separate
domains (frontend ≠ backend), a managed database, and secrets from the platform
instead of a local `.env`. Each change below closes one gap between those two
worlds.

**Golden rule:** never hardcode anything that differs between your laptop and
the server. URLs, DB connection, secrets — all come from environment variables.

---

## The 7 changes

### 1. Frontend API URL was hardcoded

**File:** `frontend/src/lib/api.ts`

```diff
- baseURL: 'http://localhost:3000/api',
+ baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api`,
```

**Why:** the deployed frontend has no `localhost:3000` — the backend lives on a
different domain (`tradel-api.herokuapp.com`). A hardcoded localhost URL means
every API call from the live site fails.

**Lesson:** any URL pointing at another service must be an env var.
`NEXT_PUBLIC_` prefix is a Next.js rule — only vars with that prefix are exposed
to browser code. The `?? 'http://localhost:3000'` keeps local dev working with
no env var set.

---

### 2. Cookie `sameSite` blocked cross-domain login

**File:** `backend/src/auth/auth.controller.ts`

```diff
- secure: process.env.NODE_ENV === 'production',
- sameSite: 'strict',
+ secure: isProd,
+ sameSite: isProd ? 'none' : 'strict',
```

**Why:** the refresh token rides an httpOnly cookie. `sameSite: 'strict'` (and
`'lax'`) tell the browser **not to send the cookie on cross-site requests**. In
prod the frontend (`tradel.vercel.app`) calling the backend
(`tradel-api.herokuapp.com`) **is** cross-site → the cookie never arrives →
refresh fails → users get logged out constantly.

`sameSite: 'none'` allows cross-site sending, but the browser **requires
`secure: true` with it** (HTTPS only). Both flip on together in prod.

**Lesson:** if frontend and backend are on different domains, the auth cookie
needs `sameSite: 'none'` + `secure: true`. Keep `strict` locally where
everything is same-origin — it's the safer default when you can use it.

---

### 3. Database pool couldn't connect to managed Postgres

**File:** `backend/src/database/database.service.ts`

```diff
- this.pool = new Pool({
-     host: ..., port: ..., user: ..., password: ..., database: ...,
- });
+ this.pool = isProd
+     ? new Pool({
+           connectionString: this.config.get('DB_URL', ...),
+           ssl: { rejectUnauthorized: false },
+       })
+     : new Pool({ host: ..., port: ..., user: ..., ... });
```

**Why:** two problems.
1. **One string vs five vars.** Managed Postgres (Heroku, Neon, Supabase…) hands
   you a single connection string, not separate host/user/password fields. The
   pool has to read `connectionString`.
2. **SSL required.** Managed Postgres refuses non-SSL connections. Without
   `ssl`, the pool errors out at boot. `rejectUnauthorized: false` skips cert
   verification (the provider's cert chain isn't in Node's trust store) —
   standard for these platforms.

Local docker-compose Postgres uses neither, so dev keeps the old 5-var path.

**Lesson:** production databases speak "connection string + SSL". Branch the
pool config on `NODE_ENV`.

---

### 4. Env validation rejected the production shape

**File:** `backend/src/config/env.validation.ts`

```diff
- DB_NAME: z.string().min(1),
- DB_USER: z.string().min(1),
- ... (all required)
+ DB_NAME: z.string().min(1).optional(),
+ DB_USER: z.string().min(1).optional(),
+ ... (all optional — prod uses DB_URL only)

+ // Heroku Postgres injects DATABASE_URL; the app expects DB_URL.
+ if (!config.DB_URL && config.DATABASE_URL) config.DB_URL = config.DATABASE_URL;
```

**Why:** the boot-time validator required all five discrete `DB_*` vars. In prod
you only have `DB_URL` — so the app would `process.exit(1)` at startup. Making
them optional lets the prod shape pass. The second line handles a naming
mismatch: Heroku names its var `DATABASE_URL`, but the whole app already reads
`DB_URL` — so map one to the other in one place instead of renaming everywhere.

**Lesson:** a strict env validator is good, but it must accept **both** the dev
and prod shapes. And know the exact var names your platform injects — they
rarely match yours.

---

### 5. Procfile — telling the platform how to run the app

**File:** `backend/Procfile` (new)

```
release: PGSSLMODE=no-verify DB_URL="$DATABASE_URL" npm run migrate:up
web: npm run start:prod
```

**Why:** platforms don't guess how to start your app. The `Procfile` declares:
- `web:` — the process that serves HTTP (`node dist/main`).
- `release:` — runs **once per deploy, before the new version goes live**. The
  perfect place for DB migrations, so the schema is always up to date before the
  app boots. `PGSSLMODE=no-verify` gives the migration tool the same SSL that
  the pool uses; `DB_URL="$DATABASE_URL"` bridges the naming gap for the
  migration process (which reads raw env, not the Zod-validated config).

**Lesson:** run migrations in a `release`/pre-deploy hook, never by hand and
never inside app boot (multiple dynos would race). Vercel/Render have their own
equivalents; the idea is the same.

---

### 6. Pinning the Node version

**File:** `backend/package.json`

```diff
+ "engines": {
+     "node": "22.x"
+ },
```

**Why:** without this the platform picks whatever Node default it likes — which
may differ from what you tested on, causing "works on my machine" bugs.
Pinning makes the build reproducible.

**Lesson:** always declare `engines.node` matching your local version before
deploying.

---

### 7. CORS origin from an env var *(was already correct)*

**File:** `backend/src/main.ts` — no change needed, noting it for completeness.

```ts
origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
credentials: true,
```

**Why it matters:** the browser blocks cross-origin requests unless the backend
explicitly allows the frontend's origin. `credentials: true` is required for the
cookie to be sent/received cross-origin. In prod you set `FRONTEND_URL` to the
Vercel URL. This was already env-driven — good pattern, leave it.

**Lesson:** CORS `origin` must list your real frontend URL in prod, and
`credentials: true` is mandatory when using cookies.

---

## Pre-deploy checklist for next time

Before deploying **any** frontend+backend+DB project:

- [ ] No hardcoded `localhost` / service URLs — all env vars.
- [ ] Frontend build-time vars use the framework's public prefix
      (`NEXT_PUBLIC_`, `VITE_`, …).
- [ ] Auth/session cookie: `sameSite: 'none'` + `secure: true` **if** frontend
      and backend are on different domains.
- [ ] DB pool reads a **connection string** + enables **SSL** in prod.
- [ ] Env validator accepts the prod var shape (and the platform's var names,
      e.g. `DATABASE_URL`).
- [ ] Migrations run in a pre-deploy/`release` hook, not by hand, not on boot.
- [ ] `engines.node` pinned to your tested version.
- [ ] CORS `origin` set to the real frontend URL + `credentials: true`.
- [ ] Secrets (JWT, DB) come from platform config vars, never committed.

Get these right and deployment is mostly clicking buttons. See `DEPLOY.md` for
the step-by-step.
