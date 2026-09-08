# Database, Migrations & Authentication

The full path from an empty Postgres container to a working register/login API — raw SQL, no ORM.

## Stack

| Layer | Choice |
|---|---|
| Framework | NestJS 11 |
| DB driver | `pg` (node-postgres) — raw SQL via `pg.Pool` |
| Migrations | `node-pg-migrate` (not an ORM — manages *when* SQL runs) |
| Password hashing | `bcrypt` (cost 12) — not argon2; bcrypt is fine for a single backend |
| Tokens | short **access** = signed JWT (`@nestjs/jwt`, client memory) + long **refresh** = opaque random string (httpOnly cookie) |
| Refresh storage | `refresh_tokens` table — hashed, **static** (same token reused until expiry or logout), **revocable** via `revoked_at` column |

---

## 1. Install

```bash
npm install bcrypt @nestjs/jwt cookie-parser
npm install -D @types/bcrypt @types/cookie-parser node-pg-migrate
```

`pg` / `@types/pg` are already installed. You don't need Passport — `@nestjs/jwt` + a custom guard is enough. `cookie-parser` lets the server read the httpOnly refresh cookie the browser sends back.

---

## 2. File structure you'll end up with

```
migrations/                         ← node-pg-migrate owns this
├── <timestamp>_users-table.sql
└── <timestamp>_refresh-tokens.sql
src/
├── config/env.validation.ts        ← already exists (Zod, validates all env)
├── database/
│   ├── database.module.ts          ← @Global wrapper
│   └── database.service.ts         ← exposes query()
├── users/
│   └── users.repository.ts         ← raw SQL for the users table
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── refresh-token.repository.ts ← raw SQL for the refresh_tokens table
│   ├── dto/{register,login}.dto.ts
│   └── guards/jwt.guard.ts
└── app.module.ts
```

---

## 3. Environment

Your app uses individual `DB_*` vars; `node-pg-migrate` uses one connection string. Keep both — same credentials.

`.env`:

```env
NODE_ENV=development
PORT=3000

DB_NAME=tradel
DB_USER=admin
DB_PASSWORD=admin
DB_PORT=5432
DB_HOST=localhost
DB_DATA=/var/lib/postgresql/data

# same creds as one URL (node-pg-migrate reads this)
DB_URL=postgres://admin:admin@localhost:5432/tradel

JWT_ACCESS_SECRET=a-very-long-secret-at-least-32-chars-long
JWT_REFRESH_SECRET=another-very-long-secret-32-chars-min
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=7d
```

> `.env` does **not** interpolate `${...}` — write `DB_URL` literally.
> Connecting from the **host** to Docker, `DB_HOST=localhost` works because compose maps `DB_PORT:5432`. Container-to-container you'd use the service name `postgres`.

Every var above is already validated in `src/config/env.validation.ts` (Zod) — a missing or malformed value fails the app at boot, loudly. `DB_URL` is checked with `z.url()`.

---

## 4. Database module (the connection pool)

### `src/database/database.service.ts`

```ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { Env } from 'src/config/env.validation';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private pool: Pool;

    constructor(private readonly config: ConfigService<Env>) {}

    onModuleInit() {
        this.pool = new Pool({
            host: this.config.get('DB_HOST', { infer: true }),
            port: this.config.get('DB_PORT', { infer: true }),
            user: this.config.get('DB_USER', { infer: true }),
            password: this.config.get('DB_PASSWORD', { infer: true }),
            database: this.config.get('DB_NAME', { infer: true }),
        });
        this.pool.on('error', (err) => this.logger.error('pg pool error', err));
        this.logger.log('Database pool initialized');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    async query<T extends QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
        return this.pool.query<T>(sql, params);
    }
}
```

> The pool is built in `onModuleInit`, not the constructor — so `ConfigService` is fully ready. This is the provider lifecycle: `onModuleInit` runs once after dependencies are resolved, `onModuleDestroy` on shutdown (where we close the pool).

### `src/database/database.module.ts`

```ts
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global() // DatabaseService injectable everywhere without re-importing
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
export class DatabaseModule {}
```

### Wire into `AppModule`

```ts
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, validate }),
        DatabaseModule,
        AuthModule,
    ],
})
export class AppModule {}
```

---

## 5. Migrations with `node-pg-migrate`

A migration is a small, **ordered, immutable** SQL file describing one schema change — plus a `pgmigrations` ledger table *inside the database* recording which files already ran. To bring any DB up to date, the tool runs only the files missing from that ledger, in order. That's what gives you history, ordering, rollback, and no drift between your machine, a teammate's, and production.

`node-pg-migrate` is **not an ORM**: you still write raw SQL. It only manages *when* and *whether* each file runs.

### Scripts (`package.json`)

```jsonc
"migrate":        "node-pg-migrate -d DB_URL",
"migrate:up":     "node-pg-migrate up -d DB_URL",
"migrate:down":   "node-pg-migrate down -d DB_URL",
"migrate:create": "node-pg-migrate create --migration-file-language sql"
```

> `-d DB_URL` tells the CLI which env var holds the connection string (its default is `DATABASE_URL`; ours is `DB_URL`). `migrate:create` only writes a file, so it needs no DB.

| Command | Does | DB? |
|---|---|---|
| `migrate:create <name>` | scaffolds an empty timestamped `.sql` in `migrations/` | no |
| `migrate:up` | runs the **Up** of every file not yet in the ledger, in order | yes |
| `migrate:down` | runs the **Down** of the single most recent applied migration, drops its ledger row | yes |

### Create and write the users migration

```bash
npm run migrate:create users_table
# → migrations/<timestamp>_users-table.sql
```

Fill in both sections by hand:

```sql
-- Up Migration
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(15)  NOT NULL UNIQUE,
    email          VARCHAR(254) NOT NULL UNIQUE,
    password_hash  TEXT         NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Down Migration
DROP TABLE users;
```

Why this is correct:
- **No `IF NOT EXISTS`** — a migration runs exactly once on a known state; a guard would hide a real bug.
- **Down is the exact inverse of Up** — write it now, while it's fresh; it's your rollback insurance.
- **`password_hash`, never `password`** — you store the bcrypt hash, not the password.
- `email VARCHAR(254)` is the max valid email length; `gen_random_uuid()` is built into PG 13+ (your image is PG16), no extension needed.

### Apply

```bash
docker compose up -d     # Postgres must be running
npm run migrate:up
```

Verify (psql lives in the container):

```bash
docker exec -it my-postgres-container psql -U admin -d tradel -c "\dt"          # users + pgmigrations
docker exec -it my-postgres-container psql -U admin -d tradel -c "SELECT * FROM pgmigrations;"
```

Run `migrate:up` again → does nothing. That idempotency is the point. `migrate:down` undoes the last one.

### Golden rule

Once a migration is committed/shared it is **immutable** — never edit or rename it. Need a change? Write a *new* migration. (While a migration is still yours alone and unshared, the `down → edit → up` loop is fine.)

> **Layers stay separate:** `database/init.sh` (Docker entrypoint) creates the *role + database* on first boot — infrastructure. Migrations own everything *inside* the DB (tables, columns, indexes). NestJS reads/writes rows. There is no `src/database/migrate.ts` — `node-pg-migrate` replaces any hand-rolled script.

In production, run the same `npm run migrate:up` as a deploy step **before** the new app code starts.

---

## 6. Users repository (raw SQL)

```ts
// src/users/users.repository.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
}

@Injectable()
export class UsersRepository {
    constructor(private readonly db: DatabaseService) {}

    async findByEmail(email: string): Promise<User | null> {
        const { rows } = await this.db.query<User>('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0] ?? null;
    }

    async create(username: string, email: string, passwordHash: string): Promise<User> {
        try {
            const { rows } = await this.db.query<User>(
                `INSERT INTO users (username, email, password_hash)
                 VALUES ($1, $2, $3)
                 RETURNING id, username, email, created_at, password_hash`,
                [username, email, passwordHash],
            );
            return rows[0];
        } catch (e: any) {
            // 23505 = unique_violation → let the DB constraint be the source of truth (no racy pre-check)
            if (e.code === '23505') throw new ConflictException('Username or email already in use');
            throw e;
        }
    }
}
```

> **Always `$1, $2, …` parameters — never string-concat user input into SQL** (injection at a trust boundary).

---

## Why two tokens (read this before step 7)

A signed JWT is **stateless** — the server can verify it without a DB lookup, which is great, but it also means you **cannot revoke it before it expires**. If that token is long-lived and gets stolen, it's valid for the whole window and you can do nothing.

The fix is to split the job in two:

- **Access token** — short-lived (10–15 min), a plain signed JWT. Carries `sub` (user id). Sent on every request in `Authorization: Bearer …`. The client keeps it **in memory** (never `localStorage` — XSS can read that). When it expires, you get a new one from the refresh endpoint.
- **Refresh token** — long-lived (7 d), used **only** to mint new access tokens. Lives in an **httpOnly, Secure, SameSite cookie** so client JS can't touch it. Every refresh token has a **row in the DB** (`refresh_tokens`), so the server can revoke it at any time (logout, admin action, security incident).

> Without the DB table, "two tokens" is cosmetic — your refresh token is just another un-revocable JWT. Steps 7–8 build the table and its repo; that's the part that makes this real.

**Static vs rotating refresh tokens.** This implementation uses **static** refresh tokens — the same token is reused on every `/auth/refresh` call until it expires (7 d) or is explicitly revoked. On each refresh, only a new access token is issued; the refresh token and its cookie stay unchanged. This is the default behaviour of Google OAuth, AWS Cognito, and most providers. The tradeoff: if a refresh token is stolen, the attacker can use it until it expires or you revoke it manually. For most applications this is an acceptable tradeoff for simpler code.

We **stay on `bcrypt`** (not argon2): argon2 is marginally stronger but bcrypt at cost 12 is fine for a single backend, and it's already installed.

---

## 7. The `refresh_tokens` migration

```bash
npm run migrate:create refresh_tokens
# → migrations/<timestamp>_refresh-tokens.sql
```

```sql
-- Up Migration
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT         NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,            -- NULL = still valid
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Down Migration
DROP TABLE refresh_tokens;
```

Apply it: `npm run migrate:up`.

Why each column:
- **`token_hash`, never the raw token** — same rule as passwords. If the DB leaks, the hashes can't be replayed. (We hash with SHA-256, not bcrypt — a refresh token is long and random already, so it doesn't need bcrypt's slow salted hashing the way a low-entropy human password does.)
- **`revoked_at`** — a soft kill switch. Logout sets it; rotation sets it on the old token; reuse-detection sets it on *all* of a user's tokens.
- **`expires_at`** — lets you expire server-side independently of the JWT's own `exp`.
- **`ON DELETE CASCADE`** — delete a user, their refresh tokens go with them. No orphans.
- **index on `user_id`** — "revoke all tokens for this user" and lookups stay fast.

> **Conclusion.** You now have server-side state for refresh tokens. This single table is the whole reason the two-token scheme is more secure than one long JWT: it turns the refresh token from *un-revocable* into *fully controlled* — revoke, expire, rotate, detect theft.

---

## 8. The refresh-token repository

```ts
// src/auth/refresh-token.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface RefreshToken {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    revoked_at: Date | null;
    created_at: Date;
}

@Injectable()
export class RefreshTokenRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await this.db.query(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [userId, tokenHash, expiresAt],
        );
    }

    // look up by the token's sha256 hash; JOIN users to get the email for the new access token
    async findByHash(tokenHash: string): Promise<(RefreshToken & { email: string }) | null> {
        const { rows } = await this.db.query<RefreshToken & { email: string }>(
            `SELECT rt.*, u.email
             FROM refresh_tokens rt
             JOIN users u ON u.id = rt.user_id
             WHERE rt.token_hash = $1`,
            [tokenHash],
        );
        return rows[0] ?? null;
    }

    async revokeByHash(tokenHash: string): Promise<void> {
        await this.db.query(
            `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
            [tokenHash],
        );
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.db.query(
            `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId],
        );
    }
}
```

> Same trust-boundary rule as the users repo: **always `$1, $2, …`, never string-concat**.

> **Conclusion.** Small raw-SQL methods — `create` (insert one row storing only the token's hash), `findByHash` (look it up on refresh, joining the user's email), `revokeByHash` (kill one on logout), `revokeAllForUser` (kill all on detected theft). This is the entire server-side surface the auth service needs.

---

---

## Current status — where you are

Steps 1–8 are done. Here is what exists in the codebase right now:

| Done | File | State |
|---|---|---|
| ✅ | `src/database/database.service.ts` | complete |
| ✅ | `src/database/database.module.ts` | complete |
| ✅ | `src/users/users.repository.ts` | complete |
| ✅ | `src/auth/refresh-token.repository.ts` | complete |
| ✅ | `migrations/*_users-table.sql` | applied |
| ✅ | `migrations/*_refresh-tokens.sql` | applied |
| ✅ | `src/auth/auth.module.ts` | partial — `RefreshTokenRepository` not yet in `providers` |
| ⬜ | `src/auth/auth.service.ts` | has register/login shells with `TODO: return jwt` — token logic not written |
| ⬜ | `src/auth/auth.controller.ts` | has register/login — no cookie handling, no refresh/logout endpoints |
| ⬜ | `src/main.ts` | missing `cookie-parser` and CORS |

**Continue from step 9.**

---

## 9. Auth module — wire in JWT + both repos

```ts
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from 'src/users/users.repository';
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env>) => ({
                // default secret/TTL = the ACCESS token; refresh signs with its own secret explicitly
                secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
                signOptions: { expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }) },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersRepository, RefreshTokenRepository],
})
export class AuthModule {}
```

> `registerAsync` is used because the secret comes from `ConfigService` at runtime — `useFactory` lets Nest inject it. The `JwtModule`'s default config is the **access** token; whenever we sign or verify a **refresh** token we pass its own secret explicitly (step 10).

> **What to do:** `RefreshTokenRepository` is already written (`src/auth/refresh-token.repository.ts`) — you only need to add it to the `providers` array here. It is not yet there in the current `auth.module.ts`.

> **Conclusion.** The module now provides both repositories and a `JwtService` pre-configured for access tokens. Nothing in here knows about cookies — that logic lives in the service, which is where it belongs.

---

## 10. Auth service — the token logic (this is the meat)

```ts
// src/auth/auth.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersRepository } from 'src/users/users.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { Env } from 'src/config/env.validation';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // keep in sync with JWT_REFRESH_TTL (7d)

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly users: UsersRepository,
        private readonly refreshTokens: RefreshTokenRepository,
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {}

    async register(body: RegisterDto) {
        const passwordHash = await bcrypt.hash(body.password, 12);
        const user = await this.users.create(body.username, body.email, passwordHash); // throws 409 on dupe
        this.logger.log(`Registered user: ${user.email}`);
        return this.issueTokens(user.id, user.email);
    }

    async login(body: LoginDto) {
        const user = await this.users.findByEmail(body.email);
        // NOTE the `!` on bcrypt.compare — fail when it does NOT match.
        // same error for "no user" and "wrong password" → no account enumeration
        if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.issueTokens(user.id, user.email);
    }

    /** Validate the refresh token and issue a new access token. The refresh token itself is NOT replaced. */
    async refresh(rawRefreshToken: string) {
        // opaque token: look it up by hash, reject if missing / revoked / expired
        const stored = await this.refreshTokens.findByHash(this.hash(rawRefreshToken));
        if (!stored || stored.revoked_at || stored.expires_at.getTime() < Date.now()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // static refresh token: issue a new access token only, refresh token stays the same
        return { accessToken: this.jwt.sign({ sub: stored.user_id, email: stored.email }) };
    }

    async logout(rawRefreshToken: string | undefined) {
        if (!rawRefreshToken) return;
        await this.refreshTokens.revokeByHash(this.hash(rawRefreshToken));
    }

    // --- helpers ---

    /** Mint an access token (JWT) + an opaque refresh token, persisting only the refresh token's hash. */
    private async issueTokens(userId: string, email: string) {
        const accessToken = this.jwt.sign({ sub: userId, email }); // module defaults = access secret + TTL

        const refreshToken = randomBytes(32).toString('hex'); // opaque random string, not a JWT
        const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
        await this.refreshTokens.create(userId, this.hash(refreshToken), expiresAt); // store only the hash

        return { accessToken, refreshToken };
    }

    private hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
```

`issueTokens` stores only the token's hash with a single `create` — one INSERT, no second write.

> Why opaque (not a JWT): the refresh token is only ever validated by a DB lookup on its hash, so a signature would add nothing — you'd verify it *and* still hit the DB. A random string means one INSERT (no id round-trip), instant revocation via `revoked_at`, and nothing sensitive at rest (only the sha256 hash). This is the pattern Auth0/WorkOS/OWASP recommend for refresh tokens.

> **Conclusion.** This file is the security core. `register`/`login` mint a pair via `issueTokens`. `refresh` looks the token up by its hash and, if the row isn't revoked or expired, issues a new access token only; the refresh token is untouched. `logout` revokes the refresh token row server-side so it cannot be used again even within its 7-day window.

---

## 11. Controller — set the cookie, expose refresh & logout

```ts
// src/auth/auth.controller.ts
import { Controller, Post, Body, Res, Req, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.auth.register(body);
        this.setRefreshCookie(res, refreshToken);
        return { accessToken };
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.auth.login(body);
        this.setRefreshCookie(res, refreshToken);
        return { accessToken };
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(@Req() req: Request) {
        const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
        if (!token) return { accessToken: null };
        const { accessToken } = await this.auth.refresh(token);
        return { accessToken }; // no new cookie — refresh token is static, stays in the browser as-is
    }

    @Post('logout')
    @HttpCode(204)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        await this.auth.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
        res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    }

    private setRefreshCookie(res: Response, token: string) {
        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true,                                   // JS can't read it → XSS-safe
            secure: process.env.NODE_ENV === 'production',    // HTTPS only in prod; off for localhost http
            sameSite: 'strict',                               // not sent on cross-site requests → CSRF-safe
            path: '/api/auth',                                // only sent to the auth routes that need it
            maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7d, matches the refresh token's life
        });
    }
}
```

> `@Res({ passthrough: true })` lets you set the cookie **and** still `return` a body the normal Nest way. Without `passthrough` you'd have to call `res.json()` yourself and lose interceptors/serialization.

> **Conclusion.** The access token goes to the client in the JSON body (it lives in memory there); the refresh token only ever travels as an httpOnly cookie scoped to `/api/auth`. `refresh` reads that cookie and returns a fresh access token — the cookie itself is never replaced. `logout` clears the cookie client-side *and* revokes the DB row server-side. The browser handles the cookie automatically — no token-shuttling code needed on the frontend.

---

## 12. `main.ts` — cookie-parser + CORS for the SPA

```ts
import cookieParser from 'cookie-parser';
// ...
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // whitelist strips unknown fields
app.use(cookieParser());                                      // populates req.cookies
app.enableCors({
    origin: 'http://localhost:5173',   // your SPA's origin (Vite default); read from env later
    credentials: true,                 // REQUIRED for the browser to send/receive the cookie
});
```

On the SPA side, every `fetch`/`axios` call must send `credentials: 'include'` / `withCredentials: true`, or the cookie never leaves the browser.

> **Conclusion.** `cookieParser()` is what makes `req.cookies` exist (the controller reads it). CORS with `credentials: true` + a specific `origin` (you cannot use `*` with credentials) is the contract that lets a browser on a different port hold the httpOnly cookie. This is the one piece that's easy to forget and produces a "login works but refresh is always empty" bug.

---

## 13. JWT guard (protect routes)

```ts
// src/auth/guards/jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from 'src/config/env.validation';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {}

    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<Request>();
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) throw new UnauthorizedException('Missing token');

        try {
            req['user'] = this.jwt.verify(token, {
                secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
        return true;
    }
}
```

Use it:

```ts
@UseGuards(JwtGuard)
@Get('profile')
profile(@Req() req: Request) {
    return req['user']; // { sub, email }
}
```

> **Conclusion.** The guard verifies only the **access** token (the short-lived one), straight from the `Authorization` header — no DB hit, which is the whole point of keeping access tokens stateless. Refresh tokens never reach protected routes; they only touch `/api/auth/refresh`.

---

## 14. Run & test

```bash
docker compose up -d        # 1. start Postgres
npm run migrate:up          # 2. apply pending migrations (users + refresh_tokens)
npm run start:dev           # 3. start the API
```

`-c cookies.txt -b cookies.txt` makes curl behave like a browser cookie jar so you can test refresh:

```bash
# register (stores the refresh cookie in cookies.txt)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ziyad","email":"test@example.com","password":"Password1A"}'

# login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1A"}'

# refresh (sends the cookie back) → new accessToken, new cookie
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/refresh

# reuse detection: replay an OLD refresh token after rotating → should 401 + revoke all
# (grab a token value from an earlier cookies.txt copy and send it manually)

# logout → 204, cookie cleared, server-side revoked
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout
```

> **Conclusion.** End to end: register/login set the cookie, refresh rotates it, logout kills it. The reuse test is the one worth doing by hand — replaying a rotated token should 401 *and* invalidate every other session for that user. If that fires, your security core works.

---

## Key points

- **Migrations own the schema; `init.sh` owns the DB+user; NestJS owns the rows.** Three layers, no overlap.
- The `pgmigrations` ledger is what makes any database catch up to the right state, in order, once each. `migrate:up` is always safe to re-run.
- Migrations are **immutable once applied** — fix forward with a new file, never edit an old one. Timestamps fix ordering; never rename.
- Pool lives in `onModuleInit`, closed in `onModuleDestroy` — never the constructor.
- Store `password_hash`, never the password. `bcrypt.hash(pw, 12)` is a good cost/speed balance. Refresh tokens are hashed with **SHA-256** (already high-entropy, no need for bcrypt's slow hashing).
- Login returns one **`Invalid credentials`** for both unknown-user and wrong-password — no enumeration. Let the DB's `UNIQUE` constraint (error `23505`) reject duplicates instead of a racy pre-check.
- **Access = stateless & short** (verified with no DB hit), **refresh = stateful & long** (a DB row you can revoke). That split is the entire security argument.
- **Static refresh tokens**: the same refresh token is reused on every `/auth/refresh` until it expires (7 d) or is revoked. Only the access token is replaced on each refresh. This is the default behaviour of Google OAuth, AWS Cognito, and most providers.
- Refresh token lives in an **httpOnly + Secure + SameSite cookie** — XSS can't read it, CSRF can't ride it. The access token lives in **client memory**, never `localStorage`.
- The **access token is a signed JWT** (`JWT_ACCESS_SECRET`); the **refresh token is opaque** (a random string, no signature), so `JWT_REFRESH_SECRET` is now unused and can be dropped from the env schema.
- CORS needs `credentials: true` + an explicit `origin` (not `*`), and the SPA must send `credentials: 'include'`, or the cookie never moves.
