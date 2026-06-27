# Contributing to Tradel

Thanks for contributing. Tradel is a NestJS 11 + TypeScript backend on PostgreSQL (raw `pg`, no ORM). All HTTP routes are prefixed with `/api`.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose (for the local PostgreSQL image)

## Setup

```bash
npm install
cp .env.example .env       # then fill in the values (see below)
docker-compose up -d       # builds the custom Postgres image and starts it
npm run migrate:up         # apply all migrations
npm run start:dev          # watch-mode dev server on :3000
```

The app validates `.env` against a Zod schema at boot (`src/config/env.validation.ts`) and **exits** if anything is missing or malformed. When you add an env var, add it to that schema **and** to `.env.example`. Note: `JWT_*_SECRET` values must be at least 32 chars.

## Database & migrations

Schema lives only in `migrations/*.sql` (raw SQL, node-pg-migrate) — there is no ORM and no schema in code.

```bash
npm run migrate:create <name>   # scaffold a new SQL migration
npm run migrate:up              # apply
npm run migrate:down            # roll back one
```

`DB_URL` must be set in `.env` — the `-d DB_URL` in the scripts is the **env var name**, not a literal URL (node-pg-migrate convention).

## Tests & checks

Before opening a PR:

```bash
npm run lint     # eslint --fix
npm run format   # prettier
npm test         # jest unit suites
npm run build    # must compile clean (tsc)
```

## Code style

- Prettier: 4-space indent, single quotes, trailing commas (`.prettierrc`).
- Imports use the `src/...` form (e.g. `src/config/env.validation`), not deep relative paths.
- DTOs use class-validator; validation runs via the global `ValidationPipe` in `main.ts`.
- Keep changes surgical — match the surrounding style, don't refactor unrelated code.

## Branches & commits

- Branch off `master`; name branches by intent (e.g. `feat/...`, `fix/...`).
- Commit messages follow the existing convention: `type(scope): summary` (e.g. `feat(auth): ...`).
- Open a PR against `master` with a short description of what and why.

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
