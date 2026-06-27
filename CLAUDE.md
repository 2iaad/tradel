# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Tradel — a NestJS 11 (Express) + TypeScript backend. Currently scoped to the auth foundation: user registration/login over PostgreSQL. All HTTP routes are prefixed with `/api` (`app.setGlobalPrefix('api')` in `src/main.ts`).

## Commands

```bash
npm run start:dev        # watch-mode dev server (default port 3000)
npm run build            # nest build -> dist/
npm run lint             # eslint --fix over {src,apps,libs,test}
npm run format           # prettier write over src/ and test/

npm test                 # jest, all *.spec.ts under src/
npm test -- auth.service # run a single suite by filename match
npm run test:e2e         # e2e suite (test/jest-e2e.json)
```

Migrations (node-pg-migrate, raw SQL files in `migrations/`):

```bash
npm run migrate:up       # apply
npm run migrate:down     # roll back one
npm run migrate:create <name>   # new SQL migration
```

Note: the `-d DB_URL` in the migrate scripts is the **name of the env var** holding the connection string (node-pg-migrate convention), not a literal URL. `DB_URL` must be set in `.env`.

## Database

No ORM despite the README calling Prisma "planned". Persistence is the raw `pg` driver:
- `DatabaseService` (`src/database/database.service.ts`) owns a single `pg.Pool`, opens it in `onModuleInit` (with a `SELECT 1` health check) and closes it in `onModuleDestroy`. Its `query<T>()` is the only DB entry point.
- Repositories write raw parameterised SQL against that — see `UsersRepository`. Postgres unique-violation `23505` is caught and rethrown as a Nest `ConflictException`.
- Schema lives only in `migrations/*.sql`, not in code. The `users` table is the source of truth for column names (`password_hash`, `created_at`).

Local Postgres is a **custom image**, not the official one: `database/Dockerfile` (alpine + postgresql16) + `database/init.sh` runs `initdb` and creates the user/db from env vars on first boot. `docker-compose up` builds it and bind-mounts data to `./volumes`.

## Architecture

NestJS module graph (full diagram in `.docs/modulare-architecture.md`):

- `AppModule` (root) imports `ConfigModule`, `DatabaseModule`, `AuthModule`.
- `ConfigModule` and `DatabaseModule` are `@Global` — `ConfigService` and `DatabaseService` inject anywhere without re-importing the module.
- There is **no `UsersModule`**. `UsersRepository` lives in `src/users/` but is registered as a provider inside `AuthModule`.
- `JwtModule.registerAsync` is configured inside `AuthModule` from `JWT_ACCESS_SECRET` / `JWT_ACCESS_TTL`.

Request flow: `AuthController` (`/auth/register`, `/auth/login`) → `AuthService` (bcrypt hash/compare, cost 12) → `UsersRepository` → `DatabaseService`.

## Env validation

`src/config/env.validation.ts` defines a Zod schema and a `validate()` that `ConfigModule.forRoot` runs against `process.env` at boot. On failure it prints the bad keys and `process.exit(1)` — the app will not start with an invalid `.env`. The inferred `Env` type is passed to `ConfigService<Env>` everywhere, so `config.get('KEY', { infer: true })` is typed. When you add an env var, add it to this schema and to `.env.example`.

## Conventions

- Prettier: 4-space indent, single quotes, trailing commas (`.prettierrc`).
- Path imports use the `src/...` form (e.g. `src/config/env.validation`), not deep relative paths.
- DTOs use class-validator; validation only runs because `app.useGlobalPipes(new ValidationPipe())` is set in `main.ts`.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
