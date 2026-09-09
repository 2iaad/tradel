# NestJS Authentication Security Review

Date: 2026-09-09  
Scope: `apps/api` authentication, authorization, session handling, and the web client's authentication helpers  
Result: **10 security findings — 3 High, 5 Medium, 2 Low**

## Review method and limits

- Built an authentication context map from each public auth route through guards, services, repositories, Prisma models, cookies, and the web session store.
- Ran Semgrep OSS 1.176.1 in full mode against `apps/api` with the security-audit, secrets, JavaScript, Node.js, TypeScript, Trail of Bits, Elttam, and Apiiro rule sets. All eight scan groups completed and produced zero alerts. The Elttam rules had 12 unrelated Java rule parse errors; Apiiro had four JavaScript/Java/Dart rule parse errors. Manual review found the business-logic issues below, which the pattern scan did not detect.
- Applied the `sharp-edges` checks. The requested `insecure-defaults` skill was not installed, so its checks were performed manually instead.
- No application code was changed. Validation tests used synthetic values and did not write to the database.

## Finding 1 — DTO mass assignment permits persistent account takeover

**Severity:** High

**Affected files and lines:**

- `apps/api/src/main.ts:15`
- `apps/api/src/accounts/accounts.controller.ts:39-45`
- `apps/api/src/accounts/accounts.service.ts:32-38`
- `apps/api/src/accounts/accounts.repository.ts:42-55`
- `apps/api/src/generated/prisma/models/accounts.ts:317-325`
- `apps/api/src/generated/prisma/models/users.ts:389-395`
- `apps/api/src/generated/prisma/models/refresh_tokens.ts:388-400`
- `apps/api/src/notes/notes.service.ts:50-52`
- `apps/api/src/notes/notes.repository.ts:46-55`

**Explanation:** The global `ValidationPipe` enables transformation but does not enable `whitelist` or `forbidNonWhitelisted`. Nest therefore leaves properties that are not declared by the DTO in the request object. The account update service spreads that runtime object into the repository, and the repository sends it directly to Prisma as `data`. TypeScript interfaces do not remove properties at runtime.

A local validation-only test confirmed that an undeclared `users.update` object survives the pipe. Prisma's generated `accountsUpdateInput` accepts that nested relation, including updates to `password_hash` and creation of `refresh_tokens`. The same pattern in note updates permits undeclared `account_id`, `trade_id`, and `created_at` fields. Nest documents that `whitelist: true` is required to remove non-DTO properties, while Prisma documents that nested writes can update related records ([Nest validation](https://docs.nestjs.com/v6/techniques/validation), [Prisma relation queries](https://www.prisma.io/docs/orm/v6/prisma-client/queries/relation-queries)).

**Exploit scenario:** An attacker obtains a victim's still-valid access token, lists or creates one of the victim's accounts, and sends a request similar to:

```http
PATCH /api/accounts/<owned-account-id>
Authorization: Bearer <stolen-access-token>
Content-Type: application/json

{
  "users": {
    "update": {
      "password_hash": "<bcrypt-hash-known-to-attacker>",
      "refresh_tokens": {
        "create": {
          "token_hash": "<sha256-of-attacker-chosen-token>",
          "expires_at": "9999-12-31T00:00:00.000Z"
        }
      }
    }
  }
}
```

The nested write targets the user related to that account. It can replace the victim's password or create a long-lived refresh session, turning short access-token theft into persistent account takeover. A related payload can move an owned note to another account/trade when those IDs are known, bypassing the service's ownership intent.

**Recommended fix:** Enable `whitelist: true` and `forbidNonWhitelisted: true` globally. More importantly, construct every Prisma `data` object from an explicit allowlist of scalar fields; never spread a request-derived object into it. Add integration tests that submit `users`, `user_id`, `account_id`, `trade_id`, `created_at`, and nested Prisma operations and assert rejection. Review every other update path for the same DTO-to-Prisma flow.

## Finding 2 — A public, predictable JWT key passes production validation

**Severity:** High (configuration-dependent)

**Affected files and lines:**

- `apps/api/.env.example:14`
- `apps/api/src/config/env.validation.ts:17-20`
- `apps/api/src/auth/auth.module.ts:17-21`
- `apps/api/src/auth/guards/jwt.guard.ts:31-36`

**Explanation:** The committed environment example contains a known numeric access-token secret. Validation checks only that the string contains at least 32 characters, so the example value passes startup unchanged. It also accepts weak values such as 32 spaces. The guard trusts any JWT with a valid signature under this one key and does not check the user against the database.

OWASP recommends that HMAC JWT keys be generated with a cryptographically secure random source, contain enough entropy, and never be hardcoded or published ([OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)).

**Exploit scenario:** A deployment copies `.env.example` and forgets to replace the access-token secret. Because the key is public, an attacker signs a JWT containing a victim's user UUID in `sub`. The guard accepts it, and all owner-scoped account, trade, note, and analytics routes act as the victim.

**Recommended fix:** Replace the example with a placeholder that deliberately fails validation. Require a CSPRNG-generated secret, preferably decoded from a fixed-size base64 value, and reject whitespace-only, known example, and common placeholder values. Use a secret manager in deployment. Rotate the access-token key and invalidate existing tokens if the example value has ever been used.

## Finding 3 — Public auth endpoints allow password attacks and CPU denial of service

**Severity:** High

**Affected files and lines:**

- `apps/api/src/auth/auth.controller.ts:19-40`
- `apps/api/src/auth/auth.service.ts:24-38`

**Explanation:** Registration, login, and refresh have no per-IP, per-account, or global request limits. Registration performs a bcrypt cost-12 hash before the database rejects a duplicate account, and login performs a cost-12 comparison for every request that names an existing user. A local benchmark averaged about 162 ms for one cost-12 hash. Parallel unauthenticated requests can keep the bcrypt worker pool and CPU busy while also allowing unlimited password guesses. OWASP calls for login throttling and defenses against automated attacks ([OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)).

**Exploit scenario:** An attacker repeatedly registers the same email or sends login guesses for a known email. Each request causes expensive bcrypt work without creating a new record. A modest parallel request stream can delay normal API work or make the service unavailable; the same endpoint also supports credential stuffing without an attempt limit.

**Recommended fix:** Add low-burst throttles before bcrypt work, keyed by both normalized account identity and source IP, with a safe global ceiling. Add increasing delays or temporary account-level lockouts, monitoring, and optional CAPTCHA after repeated failures. Keep responses uniform so the rate-control behavior does not reveal whether an account exists.

## Finding 4 — Cross-site login can force a victim into the attacker's account

**Severity:** Medium

**Affected files and lines:**

- `apps/api/src/main.ts:14-19`
- `apps/api/src/auth/auth.controller.ts:19-31,50-59`
- `apps/web/src/stores/session.ts:43-61`

**Explanation:** Login and registration set an authentication refresh cookie but do not check a CSRF token, `Origin`, `Referer`, or Fetch Metadata headers. In production the cookie explicitly uses `SameSite=None`, and Nest's default Express parsers accept form-encoded bodies. CORS stops hostile JavaScript from reading a response; it does not stop a browser from submitting a simple cross-site form or accepting its `Set-Cookie` response. OWASP recommends real CSRF defenses and notes that SameSite is only defense in depth ([OWASP CSRF Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)).

**Exploit scenario:** Where cross-site cookies are accepted, an attacker makes the victim's browser submit the attacker's own email and password to `/api/auth/login`. The response replaces the victim's refresh cookie with the attacker's session. When the victim returns to the web app, its restore flow refreshes that cookie and treats the attacker account as the current session. Private journal data the victim enters is then stored in the attacker's account and can be read by the attacker.

**Recommended fix:** Require and validate an allowlisted `Origin` on every cookie-authenticated or cookie-setting auth route, and add a CSRF token or a required custom header. Reject form content types and accept only JSON if that matches the client design. Consider a same-site deployment with `SameSite=Lax` or `Strict`; keep SameSite as a second layer, not the only check.

## Finding 5 — Stolen refresh tokens can be replayed for their full lifetime

**Severity:** Medium

**Affected files and lines:**

- `apps/api/src/auth/auth.service.ts:41-50`
- `apps/api/src/auth/refresh-token.repository.ts:38-55`
- `apps/api/src/config/env.validation.ts:20`

**Explanation:** Refresh tokens are static. A successful refresh issues only a new access token and leaves the same refresh token valid. The code has no rotation, token family, reuse detection, or automatic family revocation. The default replay window is seven days. The repository can revoke every token for a user, but the authentication flow never uses that method. OWASP recommends refresh-token rotation or sender-constrained tokens ([OWASP OAuth 2.0 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)).

**Exploit scenario:** Malware, a proxy/log leak, a compromised browser profile, or physical access exposes one refresh cookie. The attacker can repeatedly exchange the copied token for new access tokens until it expires. Normal use by the victim does not invalidate it or alert the server. Logging out another session does not revoke this stolen token.

**Recommended fix:** Rotate refresh tokens atomically on every successful refresh. Store a token family and replacement link, mark the old token used/revoked, and revoke the whole family if an already-used token appears again. Add a user-facing “sign out all sessions” action and use `revokeAllForUser` after password/security changes.

## Finding 6 — Refresh storage and lookup allow database amplification

**Severity:** Medium

**Affected files and lines:**

- `apps/api/src/auth/auth.service.ts:38,61-67`
- `apps/api/src/auth/refresh-token.repository.ts:11-24`
- `apps/api/prisma/schema.prisma:46-55`

**Explanation:** Every successful registration or login inserts a new refresh-token row, with no per-user cap or cleanup shown. The public refresh route looks up an attacker-controlled hash using `findFirst`, but `token_hash` has no index or uniqueness constraint; only `user_id` is indexed. As the table grows, random invalid refresh requests can cause repeated full-table scans.

**Exploit scenario:** An attacker creates an account and logs in repeatedly to grow the refresh-token table, then floods `/api/auth/refresh` with random cookie values. Each value is hashed cheaply by the app but can force an increasingly expensive database scan, raising database CPU and response time for all users.

**Recommended fix:** Add a unique index on `token_hash`; use a unique lookup; cap active sessions per user; revoke or delete replaced tokens; and regularly remove expired/revoked rows. Rate-limit refresh attempts and monitor invalid-token volume.

## Finding 7 — Missing `NODE_ENV` silently disables the Secure cookie flag

**Severity:** Medium (configuration-dependent)

**Affected files and lines:**

- `apps/api/.env.example:1`
- `apps/api/src/config/env.validation.ts:5`
- `apps/api/src/auth/auth.controller.ts:50-59`

**Explanation:** `NODE_ENV` silently defaults to `development`. Cookie security is then decided from raw `process.env.NODE_ENV`; anything other than the exact value `production` emits the refresh cookie without the `Secure` flag. A production instance can therefore start successfully with a transport-unsafe session cookie after a missing or mistyped deployment setting.

**Exploit scenario:** A deployment omits `NODE_ENV`, exposes an HTTP listener before redirection, lacks complete HSTS coverage, or is reached over HTTP inside a network. The browser sends the non-Secure refresh cookie in cleartext, allowing a network attacker to steal and replay the session.

**Recommended fix:** Fail startup when the deployment environment is not set explicitly. Prefer a separately validated cookie-security setting that defaults to Secure and may be disabled only in an explicit local/test mode. Enforce HTTPS at the edge and enable HSTS.

## Finding 8 — Token lifetime settings accept invalid or extreme values

**Severity:** Medium (configuration-dependent)

**Affected files and lines:**

- `apps/api/src/config/env.validation.ts:19-20`
- `apps/api/src/auth/auth.module.ts:17-21`
- `apps/api/src/auth/auth.service.ts:64-67`
- `apps/api/src/auth/auth.controller.ts:50-59`

**Explanation:** Both token lifetime settings accept any string and are cast to the `ms`/JWT types later. They are not parsed or bounded at startup. A local check confirmed that `JWT_ACCESS_TTL=100y` creates a token valid for 3,155,760,000 seconds and `JWT_REFRESH_TTL=999999d` is accepted as about 2,738 years. Other bad strings can fail only when a request tries to issue a token.

**Exploit scenario:** A typo or unsafe deployment override creates effectively permanent access and refresh tokens. One stolen token then remains useful for years, defeating the intended short access-token window. An invalid value can instead make all login and registration requests fail at runtime.

**Recommended fix:** Parse both values during startup and reject empty, invalid, non-positive, or out-of-policy durations. Set explicit upper bounds, such as minutes for access tokens and a limited number of days for refresh tokens. Store the parsed duration once and remove type casts that hide invalid configuration.

## Finding 9 — The “strong password” generator uses a non-cryptographic PRNG

**Severity:** Low

**Affected file and lines:**

- `apps/web/src/components/ui/password-field.tsx:73-91,148-158`

**Explanation:** The password generator uses `Math.random()` for every character and for shuffling, then labels the result a strong password. `Math.random()` is not cryptographically secure and must not be used for security secrets ([MDN Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)).

**Exploit scenario:** If an attacker can infer or recover the browser engine's PRNG state from observable outputs, passwords generated from the same state have much less effective secrecy than their displayed length suggests. Users are specifically encouraged to rely on these generated values for account authentication.

**Recommended fix:** Draw randomness from `crypto.getRandomValues()` and use unbiased character selection (for example, rejection sampling), including for the shuffle ([MDN `Crypto.getRandomValues`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)). Add a deterministic test by injecting a random-byte source rather than replacing the production CSPRNG.

## Finding 10 — Login timing and registration responses reveal registered emails

**Severity:** Low

**Affected files and lines:**

- `apps/api/src/auth/auth.service.ts:32-35`
- `apps/api/src/users/users.repository.ts:13-21`

**Explanation:** Login skips bcrypt entirely when an email is unknown, producing a large timing difference from the known-user path. Registration also returns a distinct conflict response when either the email or username exists. An attacker can choose a new random username for each test, making the conflict result an email-existence signal. The lack of throttling makes repeated measurements easier. OWASP recommends generic authentication and recovery responses and warns about timing differences caused by quick-exit logic ([OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)).

**Exploit scenario:** An attacker tests a list of employee or customer addresses through registration, or averages login response times. Confirmed accounts are then targeted with password spraying, phishing, or credential stuffing. Registering an unclaimed victim email also reserves it without proving ownership.

**Recommended fix:** Run a dummy bcrypt comparison for unknown users and keep the status, response body, and practical timing uniform. Change registration to a generic response and require out-of-band email verification before activating the identity. Apply the throttling from Finding 3.
