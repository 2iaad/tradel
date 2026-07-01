# Request lifecycle — browser `POST` → response

Traces one request end to end: **`POST /api/auth/register`** from the browser
until the browser gets its answer back. Login is the same path minus the
password-hash + user-insert step (see the note at the end).

Every file reference is real code in `backend/src/`.

```
Browser  ──POST──▶  Express/Nest pipeline  ──▶  Controller  ──▶  Service  ──▶  Repository  ──▶  pg Pool  ──▶  Postgres
   ▲                                                                                                              │
   └──────────────────────────  HTTP response (Set-Cookie + JSON body)  ◀─────────────────────────────────────────┘
```

---

## 0. The browser sends the request

```http
POST http://localhost:5173-origin → http://localhost:3000/api/auth/register
Content-Type: application/json

{ "username": "ziyad", "email": "z@example.com", "password": "Ziyadintra42" }
```

Because the frontend runs on a **different origin** (`:5173`) than the API
(`:3000`), this is a cross-origin call. For anything non-simple the browser
first fires a **CORS preflight** `OPTIONS`; Nest answers it from the
`enableCors({ origin: 'http://localhost:5173', credentials: true })` config in
[main.ts](../backend/src/main.ts#L15-L18). `credentials: true` is what later
lets the browser store the `Set-Cookie` that comes back.

---

## 1. The Nest / Express pipeline (runs before your code)

Set up in [main.ts](../backend/src/main.ts). Order matters — this is what each
request passes through:

| Step | Code | What it does |
|---|---|---|
| **Global prefix** | `app.setGlobalPrefix('api')` | only `/api/*` reaches controllers; `/auth/register` alone would 404 |
| **Cookie parser** | `app.use(cookieParser())` | parses the `Cookie` header into `req.cookies` (empty on register, used by `/refresh` + `/logout`) |
| **Validation pipe** | `app.useGlobalPipes(new ValidationPipe())` | validates the body against the DTO — see step 2 |
| **CORS** | `app.enableCors(...)` | allows the `:5173` origin + credentials |

If none of these reject the request, Nest routes it to the matching controller
method.

---

## 2. Validation — body must match the DTO

The route is `@Post('register')` in
[auth.controller.ts](../backend/src/auth/auth.controller.ts#L19-L24), and its
`@Body()` is typed `RegisterDto`. The `ValidationPipe` runs the
`class-validator` decorators on
[register.dto.ts](../backend/src/auth/dto/register.dto.ts) against the incoming
JSON:

- `username` — trimmed, string, length 3–15
- `email` — trimmed, valid email, ≤ 50 chars
- `password` — length 10–20, must contain lower + upper + a digit

**If any rule fails, the pipe throws `400 Bad Request` here** and your
controller code never runs — the response goes straight back to the browser.

Only a valid, typed `RegisterDto` object continues.

---

## 3. Controller — thin, just orchestrates

[auth.controller.ts:19-24](../backend/src/auth/auth.controller.ts#L19-L24)

```ts
async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.register(body);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
}
```

`@Res({ passthrough: true })` gives access to the raw Express `res` (needed to
set the cookie) **while still letting Nest serialize the returned object as the
JSON body**. The controller does no business logic — it hands off to
`AuthService` and shapes the response.

---

## 4. Service — the actual work

[auth.service.ts:24-30](../backend/src/auth/auth.service.ts#L24-L30)

```ts
async register(body: RegisterDto) {
    const passwordHash = await bcrypt.hash(body.password, 12);          // (a)
    const user = await this.users.create(body.username, body.email, passwordHash); // (b)
    return this.issueTokens(user.id, user.email);                       // (c)
}
```

**(a)** Hash the password with **bcrypt, cost 12** — the plaintext is never
stored.

**(b)** Insert the user (step 5).

**(c)** Mint the two tokens (step 6).

_(Login differs only here: instead of hash + insert it does `findByEmail` +
`bcrypt.compare`, and throws `401` on a bad match —
[auth.service.ts:32-39](../backend/src/auth/auth.service.ts#L32-L39).)_

---

## 5. Repository → pg Pool → Postgres

[users.repository.ts:21-36](../backend/src/users/users.repository.ts#L21-L36)
runs raw parameterised SQL — no ORM:

```sql
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at, password_hash
```

The `$1/$2/$3` placeholders are how `pg` prevents SQL injection. The query goes
through the single shared pool in
[database.service.ts](../backend/src/database/database.service.ts#L39-L44)
(`DatabaseService.query()` is the *only* DB entry point in the app), out to
Postgres, and back with the new row.

**Duplicate email/username** → Postgres raises unique-violation code `23505`,
which the repo catches and rethrows as
`409 ConflictException` — again short-circuiting straight back to the browser.

---

## 6. Issue the two tokens

[auth.service.ts:60-69](../backend/src/auth/auth.service.ts#L60-L69)

```
1. accessToken  = jwt.sign({ sub, email })                     JWT, access secret + short TTL (AuthModule)
2. refreshToken = randomBytes(32).toString('hex')              opaque random string, NOT a JWT
3. INSERT refresh_tokens(user_id, sha256(refreshToken), exp)   one write, hash only
```

The access token is a JWT (secret/TTL from `JwtModule.registerAsync` in
[auth.module.ts](../backend/src/auth/auth.module.ts#L14-L24)). The **refresh
token is opaque** — the DB stores only its **sha256 hash**, so a DB leak yields
no usable tokens, and there's no id round-trip or second write.

Returns `{ accessToken, refreshToken }` up to the controller.

---

## 7. Shape the response — two channels

Back in the controller, `setRefreshCookie()`
([auth.controller.ts:50-58](../backend/src/auth/auth.controller.ts#L50-L58)):

```ts
res.cookie('refresh_token', refreshToken, {
    httpOnly: true,                              // JS can't read it → XSS-safe
    secure:   process.env.NODE_ENV === 'production', // HTTPS-only in prod
    sameSite: 'strict',                          // not sent cross-site → CSRF-safe
    path:     '/api/auth',                       // only sent to auth routes
    maxAge:   ms(JWT_REFRESH_TTL),               // 7d
});
return { accessToken };                          // → JSON body
```

The **refresh token** rides back in an `httpOnly` `Set-Cookie`; the **access
token** rides back in the JSON body. Why the split lives in
[authentication.md](./authentication.md).

---

## 8. The browser receives the answer

```http
HTTP/1.1 201 Created
Set-Cookie: refresh_token=<opaque-random-hex>; HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=604800
Content-Type: application/json

{ "accessToken": "eyJhbGciOiJIUzI1NiI..." }
```

- The browser **auto-stores** the cookie (thanks to `credentials: true` on both
  sides) and will replay it only on `/api/auth/*` calls — JS never sees it.
- The frontend JS **reads `accessToken` from the body**, keeps it in memory, and
  sends it as `Authorization: Bearer <accessToken>` on later protected calls.

> Register returns **201** (Nest's default for `@Post`). Login is identical but
> tagged `@HttpCode(200)`.

---

## The whole path at a glance

```
[0] Browser POST  ─────────────────────────────────────────────┐
[1] main.ts pipeline: /api prefix · cookieParser · CORS         │  fail → 400 (validation)
[2] ValidationPipe → RegisterDto                                │
[3] AuthController.register()                                   │
[4] AuthService.register()  → bcrypt.hash(pw, 12)               │
[5] UsersRepository.create() → DatabaseService → Postgres       │  dup → 409
[6] issueTokens(): sign access JWT · opaque refresh token ·     │
    store its sha256 hash (one write)                           │
[7] setRefreshCookie(res) + return { accessToken }              │
[8] 201 + Set-Cookie(refresh) + body(access)  ─────────────────┘  → browser
```

## Where it can stop early (and what the browser gets)

| Stage | Condition | Response |
|---|---|---|
| Pipeline | bad JSON / DTO rule fails | `400 Bad Request` |
| Repository | email or username already taken | `409 Conflict` |
| Service *(login only)* | no user / wrong password | `401 Unauthorized` |
| — | all good | `201 Created` (register) / `200 OK` (login) |
