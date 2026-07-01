# Authentication -- login flow & the two-token split

> Backend: NestJS 11 (Express) + raw `pg`. All routes are under `/api`.
> This documents what happens on **`POST /api/auth/login`** and *why* the two
> tokens are returned through two different channels.

## TL;DR -- why two tokens, two channels

| | Access token | Refresh token |
|---|---|---|
| **Sent to client via** | response **body** (`{ accessToken }`) | **`Set-Cookie`** header |
| **Lifetime** | short (`JWT_ACCESS_TTL`) | long (`7d`, `JWT_REFRESH_TTL`) |
| **What it is** | a signed JWT (`JWT_ACCESS_SECRET`) | an opaque random string (`randomBytes`, not a JWT) |
| **Readable by JS?** | **yes** (that's the point) | **no** -- `httpOnly` |
| **Stored in DB?** | no (stateless) | yes, only its **sha256 hash** |
| **Client's job** | put it in `Authorization: Bearer ...` | nothing -- browser sends it back automatically |

The pattern: **the powerful, long-lived credential is locked away where
JavaScript can't touch it; the disposable, short-lived one is handed to the
client so it can authorize API calls.**

## Why the access token comes back in the body

The frontend needs to *read* this token to attach it to every protected
request as an `Authorization: Bearer <token>` header. A value JS must read
cannot live in an `httpOnly` cookie (by definition JS can't read those). So it
travels in the JSON body, the client holds it **in memory**, and sends it on
each call.

The risk of a body / JS-readable token is XSS theft -- acceptable here
**because the access token is short-lived**: if it leaks it expires quickly,
and it cannot mint new tokens (only the refresh token can).

## Why the refresh token comes back in an httpOnly cookie

The refresh token is the high-value credential -- it mints fresh access tokens
for `7d`. So it gets the strongest browser-enforced protection, set in
`AuthController.setRefreshCookie()`:

- **`httpOnly: true`** -- JavaScript (and therefore any XSS payload) can never
  read it. This is the single biggest reason it's a cookie and not the body.
- **`sameSite: 'strict'`** -- the browser won't attach it to cross-site
  requests -> CSRF-safe.
- **`secure`** (prod only) -- HTTPS-only; left off on localhost http.
- **`path: '/api/auth'`** -- the browser only sends it to the auth routes that
  actually need it (`/refresh`, `/logout`), never to the rest of the API.
- **`maxAge`** -- matches `JWT_REFRESH_TTL` (7d).

The DB only ever stores the **sha256 hash** of the refresh token, so even a
database leak doesn't hand an attacker usable tokens.

## What you actually see in Thunder Client

Thunder Client isn't a browser, but it acts like one's network layer: it
renders the JSON **body** (so you *see* the access token) and quietly drops the
`Set-Cookie` value into its **cookie jar** (so the refresh token shows up under
*Cookies*, **not** the body). On your next `POST /api/auth/refresh`, Thunder
Client replays that cookie automatically -- that's how `/refresh` issues a new
access token without you ever pasting the refresh token yourself.

## Full request flow -- in order

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  THUNDER CLIENT  (an HTTP client -- behaves like a browser network layer)          │
├────────────────────────────────────────────────────────────────────────────────────┤
│  POST  http://localhost:3000/api/auth/login                                        │
│  Content-Type: application/json                                                    │
│                                                                                    │
│  { "email": "derfoufiziad1@gmail.com", "password": "Ziyadintra42@" }               │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   [1] request travels over TCP
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  NestJS PIPELINE  (src/main.ts, runs before your code)                             │
├────────────────────────────────────────────────────────────────────────────────────┤
│  cookieParser()         -> parses Cookie header (none on login, fine)              │
│  setGlobalPrefix('api') -> /api/* is routed into controllers                       │
│  CORS (localhost:5173, credentials:true)                                           │
│  ValidationPipe         -> body must match LoginDto                                │
│                            [fail] -> 400 Bad Request (stops here)                  │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   [2] validated body
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  AuthController.login()    @Post('login')  @HttpCode(200)                          │
├────────────────────────────────────────────────────────────────────────────────────┤
│  const { accessToken, refreshToken } = await authService.login(body)               │
│  (cookie is set + body returned AFTER the service resolves -- step [6])            │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   [3] email + password
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  AuthService.login()                                                               │
├────────────────────────────────────────────────────────────────────────────────────┤
│  user = users.findByEmail(email)                                                   │
│  bcrypt.compare(password, user.password_hash)    (cost 12)                         │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   query
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL  --  users table                                                       │
├────────────────────────────────────────────────────────────────────────────────────┤
│  SELECT * FROM users WHERE email = $1                                              │
│                                                                                    │
│  [fail] no user  OR  password mismatch                                             │
│         -> throw UnauthorizedException -> 401  (stops here, NO tokens)             │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   [4] credentials OK
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  AuthService.issueTokens(user.id, user.email)                                      │
├────────────────────────────────────────────────────────────────────────────────────┤
│  1. accessToken  = jwt.sign({ sub, email })                                        │
│                    signed w/ JWT_ACCESS_SECRET,  short TTL (JWT_ACCESS_TTL)        │
│                                                                                    │
│  2. refreshToken = randomBytes(32).toString('hex')                                 │
│                    opaque random string -- NOT a JWT, carries no data              │
│                                                                                    │
│  3. INSERT INTO refresh_tokens (user_id, token_hash, expires_at)                   │
│     token_hash = sha256(refreshToken)    <- ONE insert, DB stores only the HASH    │
│     (no id round-trip, no update -- the raw token never lives in the DB)           │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   [5] { accessToken, refreshToken }
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  AuthController  --  shape the HTTP response (the whole point of the split)        │
├────────────────────────────────────────────────────────────────────────────────────┤
│  res.cookie('refresh_token', refreshToken, {                                       │
│      httpOnly: true,         JS can NEVER read it     -> XSS-safe                  │
│      sameSite: 'strict',     not sent cross-site       -> CSRF-safe                │
│      secure:   prod only,    HTTPS-only in production                              │
│      path:     '/api/auth',  sent ONLY to auth routes                              │
│      maxAge:   7d            matches refresh token life                            │
│  })                                                                                │
│                                                                                    │
│  return { accessToken }      -> goes into the JSON body                            │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │   [6] HTTP 200
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  HTTP RESPONSE                                                                     │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Status: 200 OK                                                                    │
│                                                                                    │
│  Set-Cookie: refresh_token=<jwt>;                                                  │
│              HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=604800             │
│                                                                                    │
│  Body:  { "accessToken": "eyJhbGciOiJIUzI1NiI..." }                                │
└────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  THUNDER CLIENT  receives                                                          │
├────────────────────────────────────────────────────────────────────────────────────┤
│  - Response > Body  : accessToken is VISIBLE  (copy it into the next               │
│                       request as  Authorization: Bearer <accessToken>)             │
│                                                                                    │
│  - Cookies (jar)    : refresh_token stored automatically, hidden from              │
│                       the body, auto-attached ONLY to /api/auth/* calls            │
│                       (e.g. POST /api/auth/refresh, /api/auth/logout)              │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## Step-by-step (matches the numbers above)

1. **[1]** Thunder Client sends the `POST` with the JSON credentials.
2. **[2]** NestJS middleware runs first: `cookieParser`, the `/api` prefix
   routing, CORS, then `ValidationPipe` checks the body against `LoginDto`.
   Invalid shape -> `400`, your code never runs.
3. **[3]** `AuthController.login()` hands the credentials to `AuthService`.
4. **[4]** `AuthService.login()` looks the user up by email and `bcrypt.compare`s
   the password. No user or wrong password -> `401 Unauthorized`, no tokens.
5. Credentials good -> `issueTokens()`:
   - signs the **access token** (JWT, access secret, short TTL),
   - generates the **refresh token** as an opaque `randomBytes(32)` hex string
     (not a JWT, carries no data),
   - `INSERT`s one `refresh_tokens` row storing only its **sha256 hash**.
6. **[5]/[6]** Back in the controller: the refresh token is written as the
   `httpOnly` cookie, and `{ accessToken }` is returned as the body -> `200 OK`.
7. Thunder Client shows the access token in the body and stores the refresh
   cookie in its jar for the next `/api/auth/*` call.

## Related routes (same two-channel idea)

- **`POST /api/auth/register`** -- identical: body gets `accessToken`, cookie
  gets `refresh_token`.
- **`POST /api/auth/refresh`** -- reads `refresh_token` **from the cookie**
  (never the body), hashes it and looks the row up by that hash, rejects if
  the row is missing / revoked / expired, and returns a **new access token** in
  the body. The refresh token itself is static (not rotated).
- **`POST /api/auth/logout`** -- revokes the refresh token in the DB and clears
  the cookie (`204`).
