# How to build the AccountsModule — a learning guide

This file does not give you the final code. It explains **the order to do
things in, and why**, using the `AuthModule` you already have as the model
to learn from. You already wrote working auth code — accounts is the same
shape, smaller.

Goal at the end: a logged-in user can create an "account" (like "FTMO 100k"
or "Demo"), and only see/edit their own accounts.

---

## Step 0 — Understand the shape you're copying

Look at how `AuthModule` is built. It has 4 pieces, each with **one job**:

```
Controller   → reads the HTTP request, calls the service, returns HTTP response
Service      → the business logic ("what should happen")
Repository   → the only thing allowed to talk to Postgres
Module       → wires the 3 above together so Nest knows they exist
```

This is called "separation of concerns" — the reason it's split this way is
so each file only needs to know about **one layer**. The controller doesn't
know SQL exists. The repository doesn't know what an HTTP request is.

You will build the exact same 4 pieces for accounts:

```
AccountsController  → GET /accounts, POST /accounts
AccountsService      → "create an account for this user", "list this user's accounts"
AccountsRepository   → INSERT INTO accounts..., SELECT * FROM accounts...
AccountsModule       → wires them together
```

---

## Step 1 — The database table (do this first, always)

Before any TypeScript, the table must exist. Nothing can be tested without
it. Look at `backend/migrations/1782038103848_users-table.sql` — that's your
template for style (UUID id, `NOT NULL`, `created_at` default `NOW()`).

Run:
```bash
npm run migrate:create accounts-table
```

This creates an empty SQL file in `migrations/`. Fill the "Up Migration"
part with a `CREATE TABLE accounts (...)` — same style as the `users` table:
`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, a `user_id` column that
`REFERENCES users(id) ON DELETE CASCADE` (this means: if a user is deleted,
their accounts are deleted automatically by Postgres, you don't have to
write that logic yourself), and a `name` column.

Fill "Down Migration" with `DROP TABLE accounts;` — this is what lets you
undo the migration if you made a mistake.

Then run:
```bash
npm run migrate:up
```

**Checkpoint:** open your Postgres client and confirm the `accounts` table
exists with the right columns. Don't move to Step 2 until this works —
everything after depends on the table being real.

---

## Step 2 — The Repository (talks to the database, nothing else)

Look at `src/users/users.repository.ts`. Notice:
- It only has 2 methods: `findByEmail` and `create`. Small, focused.
- Every method calls `this.db.query(...)`, never anything else.
- It defines a small `interface User { ... }` at the top matching the SQL
  columns exactly (this is just for TypeScript to know the shape of a row —
  Postgres doesn't know about TypeScript, so you write this by hand).
- It catches Postgres error code `23505` (means "unique constraint
  violated") and turns it into a proper HTTP-friendly `ConflictException`.

**Your task:** write `AccountsRepository` in `src/accounts/accounts.repository.ts`
with an `Account` interface (matching your new table's columns), and two
methods to start:
- `create(userId, name)` → inserts a row, returns it
- `findAllByUserId(userId)` → selects all accounts where `user_id = $1`

Ask yourself while writing it: *"if I only had this file, with no idea what
NestJS or HTTP is, would this still make sense as 'a thing that reads and
writes accounts in the database'?"* If yes, you got the separation right.

---

## Step 3 — The Service (the business logic / rules)

Look at `src/auth/auth.service.ts`. Notice the service doesn't know
anything about HTTP requests or responses — it just takes plain data in
(`RegisterDto`), does logic (hash password, save user, make tokens), and
returns plain data out. It calls the repository, never touches SQL itself.

**Your task:** write `AccountsService` with methods like:
- `create(userId: string, name: string)` → calls
  `this.accounts.create(userId, name)`, returns the account
- `findAllForUser(userId: string)` → calls
  `this.accounts.findAllByUserId(userId)`

Right now this looks like it "just forwards" to the repository, and that's
fine — the service exists so that later, when you need actual *rules* (e.g.
"a user can have at most 5 accounts"), you have one obvious place to put
that check, without touching the controller or the repository.

---

## Step 4 — Knowing who's logged in: `JwtGuard` and `@Req()`

This is the part that's new compared to auth (auth routes are the only ones
that *don't* require a login already). Look at `src/auth/guards/jwt.guard.ts`.

In simple words: a **guard** in NestJS is a checkpoint that runs *before*
your controller method. `JwtGuard` reads the `Authorization: Bearer <token>`
header, verifies the JWT is valid, and — this is the important part —
attaches the decoded token payload onto the request object:
`req['user'] = { sub: userId, email }`.

`sub` is a standard JWT field name meaning "subject" — here, it's the
user's id.

So in your `AccountsController`, you protect every route with
`@UseGuards(JwtGuard)`, and inside the method you read `@Req() req: Request`
and pull `req.user.sub` — that's your logged-in user's id. You pass that id
down into the service, which passes it down into the repository. **This is
how "only see your own accounts" works — you never trust an id sent by the
client in the request body, you always use the id from the verified JWT.**

---

## Step 5 — The DTO (validating what comes in)

Look at `src/auth/dto/register.dto.ts`. A DTO ("Data Transfer Object") is
just a class describing the shape of the request body, with decorators
(`@IsString()`, `@Length()`, etc.) that `ValidationPipe` (already turned on
globally in `main.ts`) checks automatically before your controller code
even runs. If validation fails, the client gets a 400 error for free — you
never write an `if` statement to check this yourself.

**Your task:** write `CreateAccountDto` with just a `name` field: string,
not empty, some reasonable max length (look at how `username` is validated
in `RegisterDto` for the pattern — `@IsString()`, `@IsNotEmpty()`,
`@Length(...)`).

---

## Step 6 — The Controller (wires HTTP to the service)

Look at `src/auth/auth.controller.ts`. Two things to notice:
- `@Controller('auth')` — this is the route prefix. Yours will be
  `@Controller('accounts')`.
- Each method is thin: read input, call the service, return the result.
  No logic lives here.

**Your task:** write `AccountsController` with:
- `@UseGuards(JwtGuard)` on the whole controller (so *every* route needs a
  valid login — accounts should never be public)
- `@Post()` → takes `@Body() body: CreateAccountDto` and `@Req() req`, calls
  `accountsService.create(req.user.sub, body.name)`
- `@Get()` → calls `accountsService.findAllForUser(req.user.sub)`

---

## Step 7 — The Module (wiring)

Look at `src/auth/auth.module.ts`. A module is just a list: which
controllers exist, which providers (services/repositories) exist. NestJS
uses this list to know what to construct and inject where.

**Your task:** write `AccountsModule`:
```
controllers: [AccountsController]
providers: [AccountsService, AccountsRepository]
```

Then add `AccountsModule` to the `imports` array in `src/app.module.ts` —
this is the step that actually makes NestJS load it. Forgetting this step
is the single most common mistake: you write everything correctly and
still get 404, because the module was never registered.

---

## Step 8 — Test it manually, in this order

Don't write the next feature (trades) until this works end-to-end:

1. Log in via `/api/auth/login`, copy the `accessToken` from the response.
2. Call `POST /api/accounts` with `Authorization: Bearer <token>` and
   `{ "name": "Demo" }` in the body. Confirm you get the created account
   back, with an id.
3. Call `GET /api/accounts` with the same token. Confirm you see the
   account you just created.
4. Try calling either route **without** the `Authorization` header. Confirm
   you get a 401 — this proves `JwtGuard` is actually protecting the route,
   not just present but doing nothing.

If all 4 checks pass, the pattern is proven, and this is the exact pattern
you reuse for `trades` and `journal_notes` later — same 4 files, same
guard, same "always filter by the logged-in user's id" rule.

---

## Summary — the reusable checklist

Every new resource in this backend (accounts, later trades, later journal)
follows this same 8-step order:

1. Migration (table exists)
2. Repository (raw SQL, one file, no HTTP knowledge)
3. Service (business logic, calls repository)
4. Guard usage (know who's logged in via the JWT)
5. DTO (validate the request body)
6. Controller (thin, wires HTTP → service)
7. Module (register controller + providers, then import it in `AppModule`)
8. Manual test (logged-in works, logged-out gets 401)
