# Tradel

NestJS backend for the Tradel application. Currently implements the authentication foundation (routing, validation, config) — persistence and JWT issuance are the next steps.

---

## Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Runtime    | Node.js                            |
| Framework  | NestJS 11 (on top of Express)      |
| Language   | TypeScript 5.7                     |
| Database   | PostgreSQL 16                      |
| ORM        | Prisma _(planned)_                 |
| Validation | class-validator + Zod              |
| Auth       | JWT (access + refresh) _(planned)_ |

---

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL 16 (or Docker to run the provided image)

---

## Getting Started

**1. Clone and install dependencies**

```bash
git clone <repo-url>
cd tradel
npm install
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your values — see [Environment Variables](#environment-variables) below.

**3. Start the database**

The `database/` directory contains a Dockerfile and `init.sh` that create a PostgreSQL 16 instance with a superuser and database. You can run it directly or use any Postgres instance.

**4. Run the app**

```bash
npm run start:dev
```

The server starts on `http://localhost:<PORT>` (default 3000). All routes are prefixed with `/api`.

---

## Environment Variables

Defined and validated in [src/config/env.validation.ts](src/config/env.validation.ts) using Zod. The app exits with a clear error message if any required variable is missing or invalid.

| Variable             | Required | Default       | Description                                      |
| -------------------- | -------- | ------------- | ------------------------------------------------ |
| `NODE_ENV`           | no       | `development` | `development` \| `production` \| `test`          |
| `PORT`               | no       | `3000`        | Port the HTTP server listens on                  |
| `DB_HOST`            | yes      | —             | PostgreSQL host                                  |
| `DB_PORT`            | no       | `5432`        | PostgreSQL port                                  |
| `DB_USER`            | yes      | —             | PostgreSQL user                                  |
| `DB_PASSWORD`        | yes      | —             | PostgreSQL password                              |
| `DB_NAME`            | yes      | —             | PostgreSQL database name                         |
| `JWT_ACCESS_SECRET`  | yes      | —             | Secret for signing access tokens (min 32 chars)  |
| `JWT_REFRESH_SECRET` | yes      | —             | Secret for signing refresh tokens (min 32 chars) |
| `JWT_ACCESS_TTL`     | no       | `900s`        | Access token lifetime                            |
| `JWT_REFRESH_TTL`    | no       | `7d`          | Refresh token lifetime                           |

---

## Project Structure

```
src/
├── main.ts                   # Bootstrap: global prefix, ValidationPipe, listen
├── app.module.ts             # Root module — wires ConfigModule + feature modules
├── config/
│   └── env.validation.ts     # Zod schema + validate() called by ConfigModule
└── auth/
    ├── auth.module.ts        # Auth feature module
    ├── auth.controller.ts    # Route handlers for /api/auth/*
    ├── auth.service.ts       # Business logic (stubs — see TODOs)
    └── dto/
        ├── register.dto.ts   # Validated shape for POST /auth/register
        └── login.dto.ts      # Extends RegisterDto (picks email + password)

database/
├── Dockerfile                # PostgreSQL 16 Alpine image
└── init.sh                   # Creates superuser, database, and pg_hba config

docs/
├── 00-init.md               # NestJS CLI reference
├── 01-overview.md           # NestJS concepts (controllers, modules, etc.)
├── 02-env-variables.md      # Notes on ConfigModule and ConfigService
├── 03-m-c-p.tldr            # Module/Controller/Provider diagram (tldraw)
└── 04-db.tldr               # Database schema diagram (tldraw)
```

---

## API

Base URL: `http://localhost:<PORT>/api`

All request bodies are JSON. Validation is handled globally via NestJS `ValidationPipe` — invalid requests return `400` with field-level error messages automatically.

### Auth

#### `POST /api/auth/register`

**Body**

| Field      | Type   | Rules                                                       |
| ---------- | ------ | ----------------------------------------------------------- |
| `username` | string | 3–15 chars, trimmed                                         |
| `email`    | string | valid email, max 50 chars, trimmed                          |
| `password` | string | 10–20 chars, must include uppercase, lowercase, and a digit |

**Response** — currently echoes the body back. Will return JWT tokens once the service TODOs are completed.

---

#### `POST /api/auth/login`

**Body**

| Field      | Type   | Rules       |
| ---------- | ------ | ----------- |
| `email`    | string | valid email |
| `password` | string | 10–20 chars |

**Response** — currently echoes the body back. Will return JWT tokens once the service TODOs are completed.

---

## Scripts

```bash
npm run start:dev     # Development server with watch mode (recommended)
npm run start:prod    # Run compiled output from dist/
npm run build         # Compile TypeScript → dist/
npm run lint          # ESLint with auto-fix
npm run format        # Prettier across src/ and test/
npm run test          # Unit tests (Jest)
npm run test:cov      # Unit tests with coverage report
npm run test:e2e      # End-to-end tests
```

---

## What's Not Done Yet

The authentication routes exist and validate input, but the following is still pending in [src/auth/auth.service.ts](src/auth/auth.service.ts):

- Check if a user with the given email already exists
- Hash the password with a salt (e.g. bcrypt)
- Persist the new user in the database
- Issue a signed JWT access + refresh token pair on register
- Verify credentials and issue tokens on login
- Wire in Prisma (`app.module.ts` has the TODO)
