# Database, Migrations & Authentication

The full path from an empty Postgres container to a working register/login API — raw SQL, no ORM.

## Stack

| Layer | Choice |
|---|---|
| Framework | NestJS 11 |
| DB driver | `pg` (node-postgres) — raw SQL via `pg.Pool` |
| Migrations | `node-pg-migrate` (not an ORM — manages *when* SQL runs) |
| Password hashing | `bcrypt` |
| Tokens | `@nestjs/jwt` (access + refresh) |

---

## 1. Install

```bash
npm install bcrypt @nestjs/jwt
npm install -D @types/bcrypt node-pg-migrate
```

`pg` / `@types/pg` are already installed. You don't need Passport — `@nestjs/jwt` + a custom guard is enough for basic JWT.

---

## 2. File structure you'll end up with

```
migrations/                         ← node-pg-migrate owns this
└── <timestamp>_users-table.sql
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

## 7. Auth module — JWT + bcrypt

### `src/auth/auth.module.ts`

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from 'src/users/users.repository';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env>) => ({
                secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
                signOptions: { expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }) },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersRepository],
})
export class AuthModule {}
```

### `src/auth/auth.service.ts`

```ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersRepository } from 'src/users/users.repository';
import { Env } from 'src/config/env.validation';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly users: UsersRepository,
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {}

    async register(body: RegisterDto) {
        const passwordHash = await bcrypt.hash(body.password, 12);
        const user = await this.users.create(body.username, body.email, passwordHash); // throws 409 on dupe
        this.logger.log(`Registered user: ${user.email}`);
        return this.signTokens(user.id, user.email);
    }

    async login(body: LoginDto) {
        const user = await this.users.findByEmail(body.email);
        // same error for "no user" and "wrong password" → no account enumeration
        if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.signTokens(user.id, user.email);
    }

    private signTokens(userId: string, email: string) {
        const payload = { sub: userId, email };
        return {
            accessToken: this.jwt.sign(payload),
            refreshToken: this.jwt.sign(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
                expiresIn: this.config.get('JWT_REFRESH_TTL', { infer: true }),
            }),
        };
    }
}
```

### `src/auth/auth.controller.ts`

```ts
import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    register(@Body() body: RegisterDto) {
        return this.auth.register(body);
    }

    @Post('login')
    login(@Body() body: LoginDto) {
        return this.auth.login(body);
    }
}
```

> DTOs use `class-validator` (already installed). Match the DB limits: `@MaxLength(15)` username, `@IsEmail()` email. Enable validation globally in `main.ts` with `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`.

---

## 8. JWT guard (protect routes)

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

---

## 9. Run & test

```bash
docker compose up -d        # 1. start Postgres
npm run migrate:up          # 2. apply pending migrations
npm run start:dev           # 3. start the API
```

```bash
# register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ziyad","email":"test@example.com","password":"Password1"}'

# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1"}'
```

---

## Key points

- **Migrations own the schema; `init.sh` owns the DB+user; NestJS owns the rows.** Three layers, no overlap.
- The `pgmigrations` ledger is what makes any database catch up to the right state, in order, once each. `migrate:up` is always safe to re-run.
- Migrations are **immutable once applied** — fix forward with a new file, never edit an old one. Timestamps fix ordering; never rename.
- Pool lives in `onModuleInit`, closed in `onModuleDestroy` — never the constructor.
- Store `password_hash`, never the password. `bcrypt.hash(pw, 12)` is a good cost/speed balance.
- Login returns one **`Invalid credentials`** for both unknown-user and wrong-password — no enumeration. Let the DB's `UNIQUE` constraint (error `23505`) reject duplicates instead of a racy pre-check.
- Access and refresh secrets **must differ** — already separated as `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`.
