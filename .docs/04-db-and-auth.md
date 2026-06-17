# Database Connection & Authentication Setup

## Stack Context

| Layer | Choice |
|---|---|
| Framework | NestJS 11 |
| DB Driver | `pg` (node-postgres) — already installed |
| Password hashing | `bcrypt` |
| Tokens | `@nestjs/jwt` (access + refresh) |
| No ORM | Raw SQL with `pg.Pool` |

---

## 1. Install Missing Dependencies

```bash
npm install bcrypt @nestjs/jwt
npm install -D @types/bcrypt
```

You already have `pg` and `@types/pg`. You don't need Passport for basic JWT — NestJS's `@nestjs/jwt` + a custom guard is enough.

---

## 2. File Structure You'll End Up With

```
src/
├── config/
│   └── env.validation.ts       ← already exists
├── database/
│   ├── database.module.ts      ← NEW: wraps pg.Pool
│   └── database.service.ts     ← NEW: exposes query()
├── auth/
│   ├── auth.module.ts          ← update
│   ├── auth.service.ts         ← update
│   ├── auth.controller.ts      ← already exists
│   ├── guards/
│   │   └── jwt.guard.ts        ← NEW
│   └── dto/
│       ├── register.dto.ts     ← already exists
│       └── login.dto.ts        ← already exists
├── users/
│   └── users.repository.ts     ← NEW: raw SQL for users table
└── app.module.ts               ← update
```

> When connecting from the **host machine** to Docker, `DB_HOST=localhost` works because your `docker-compose.yml` maps `DB_PORT:5432`. Inside Docker-to-Docker, you'd use the service name `postgres`.

---

## 4. Create the Database Module

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

        this.pool.on('error', (err) => {
            this.logger.error('Unexpected pg pool error', err);
        });

        this.logger.log('Database pool initialized');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    async query<T extends QueryResultRow>(
        sql: string,
        params?: unknown[],
    ): Promise<QueryResult<T>> {
        return this.pool.query<T>(sql, params);
    }
}
```

### `src/database/database.module.ts`

```ts
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()   // ← makes DatabaseService available everywhere without re-importing
@Module({
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}
```

### Wire it into `AppModule`

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, validate }),
        DatabaseModule,   // ← add this
        AuthModule,
    ],
})
export class AppModule {}
```

---

## 5. Create the Users Table (Raw SQL Migration)

No ORM means you write and run the SQL yourself. Create a one-time script:

```ts
// src/database/migrate.ts  (run once with: npx ts-node src/database/migrate.ts)
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const sql = `
    CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username    VARCHAR(15)  NOT NULL UNIQUE,
        email       VARCHAR(50)  NOT NULL UNIQUE,
        password    TEXT         NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
`;

async function migrate() {
    await pool.query(sql);
    console.log('Migration done.');
    await pool.end();
}

migrate().catch((e) => { console.error(e); process.exit(1); });
```

Run it **once** after your Docker container is up:

```bash
npx ts-node src/database/migrate.ts
```

---

## 6. Users Repository (Raw SQL)

```ts
// src/users/users.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    created_at: Date;
}

@Injectable()
export class UsersRepository {
    constructor(private readonly db: DatabaseService) {}

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.db.query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email],
        );
        return result.rows[0] ?? null;
    }

    async create(username: string, email: string, hashedPassword: string): Promise<User> {
        const result = await this.db.query<User>(
            `INSERT INTO users (username, email, password)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [username, email, hashedPassword],
        );
        return result.rows[0];
    }
}
```

---

## 7. Auth Module — JWT + bcrypt

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
            imports: [ConfigModule],
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
import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
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
        const existing = await this.users.findByEmail(body.email);
        if (existing) throw new ConflictException('Email already in use');

        const hashedPassword = await bcrypt.hash(body.password, 12);
        const user = await this.users.create(body.username, body.email, hashedPassword);

        this.logger.log(`Registered user: ${user.email}`);
        return this.signTokens(user.id, user.email);
    }

    async login(body: LoginDto) {
        const user = await this.users.findByEmail(body.email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const passwordMatch = await bcrypt.compare(body.password, user.password);
        if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

        return this.signTokens(user.id, user.email);
    }

    private signTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const accessToken = this.jwt.sign(payload);

        const refreshToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
            expiresIn: this.config.get('JWT_REFRESH_TTL', { infer: true }),
        });

        return { accessToken, refreshToken };
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
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }

    @Post('login')
    login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }
}
```

---

## 8. JWT Guard (Protect Routes)

```ts
// src/auth/guards/jwt.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {}

    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<Request>();
        const token = this.extractToken(req);

        if (!token) throw new UnauthorizedException('Missing token');

        try {
            const payload = this.jwt.verify(token, {
                secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
            });
            req['user'] = payload;  // attach to request for downstream use
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        return true;
    }

    private extractToken(req: Request): string | null {
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
}
```

**Usage on any protected route:**

```ts
@UseGuards(JwtGuard)
@Get('profile')
profile(@Req() req: Request) {
    return req['user'];  // { sub: userId, email }
}
```

---

## 9. Complete `.env`

```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_NAME=tradel
DB_USER=tradel_user
DB_PASSWORD=your_secure_password
DB_PORT=5433

JWT_ACCESS_SECRET=a-very-long-secret-at-least-32-chars-long
JWT_REFRESH_SECRET=another-very-long-secret-at-least-32-chars
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=7d
```

---

## 10. Full Startup Sequence

```bash
# 1. Start the database
docker compose up -d

# 2. Run the migration (only once)
npx ts-node src/database/migrate.ts

# 3. Start the server
npm run start:dev
```

**Test it:**

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ziyad","email":"test@example.com","password":"Password1"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1"}'
```

---

## Key Points to Remember

- `pg.Pool` is initialized in `onModuleInit` so `ConfigService` is fully ready — never in the constructor
- `@Global()` on `DatabaseModule` means `DatabaseService` is injected anywhere without re-importing the module
- **Never throw `'User not found'` then `'Wrong password'` separately** — always `'Invalid credentials'` for both (timing/enumeration attacks)
- `bcrypt.hash(password, 12)` — cost factor 12 is a good balance of security vs speed (~300ms on modern hardware)
- The access token secret and refresh token secret **must be different** — you're already set up for this with `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- The migration script is a one-time manual step — for a real project you'd want a proper migration tool like `node-pg-migrate` or `sql-migrate`
