# Contributing to Tradel

Thanks for contributing. Tradel is an npm workspace with a NestJS API in
`apps/api`, a Next.js web app in `apps/web`, and PostgreSQL managed through
Prisma. All API routes are prefixed with `/api`.

## Prerequisites

- Node.js 22
- Docker + Docker Compose (for the local PostgreSQL image)

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d
npm run prisma:migrate:deploy
npm run dev:api
npm run dev:web
```

Run the two development commands in separate terminals. The API validates its
environment at boot using `apps/api/src/config/env.validation.ts` and exits if
anything is missing or malformed. When you add an API environment variable,
update that schema and `apps/api/.env.example`. `JWT_*_SECRET` values must be
at least 32 characters.

## Database & migrations

The Prisma schema and migration history live under `apps/api/prisma`.

```bash
npm run prisma:migrate:dev -- --name <name>
npm run prisma:migrate:deploy
npm run prisma:studio
```

Set `DB_URL` in `apps/api/.env`. Never run `prisma migrate reset` against a
database whose data must be kept.

## Tests & checks

Before opening a PR:

```bash
npm run lint     # eslint --fix
npm run format   # prettier
npm test         # run available workspace tests
npm run build    # build both applications
```

## Code style

- Prettier: 4-space indent, single quotes, trailing commas (`.prettierrc`).
- API imports use the `src/...` form (for example,
  `src/config/env.validation`), not deep relative paths.
- DTOs use class-validator; validation runs via the global `ValidationPipe` in `main.ts`.
- Keep changes surgical — match the surrounding style, don't refactor unrelated code.

## Branches & commits

- Branch off `master`; name branches by intent (e.g. `feat/...`, `fix/...`).
- Commit messages follow the existing convention: `type(scope): summary` (e.g. `feat(auth): ...`).
- Open a PR against `master` with a short description of what and why.

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
