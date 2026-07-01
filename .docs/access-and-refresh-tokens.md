# Access & Refresh Tokens

Two tokens, two jobs. One is short-lived and does the work; the other is long-lived and only exists to hand out fresh copies of the first.

## Access token

- **What:** a JWT signed with `JWT_ACCESS_SECRET`, payload `{ sub: userId, email }`.
- **Lives:** short (`JWT_ACCESS_TTL`, e.g. 15m).
- **Where:** returned in the JSON body of `/register`, `/login`, `/refresh`. The client keeps it in memory and sends it as `Authorization: Bearer <token>` on every protected request.
- **Why short:** it's stateless — nothing in the DB tracks it, so it can't be revoked. Keeping it short-lived caps the damage if it leaks: it just expires.
- **Checked by:** `JwtGuard` verifies the signature + expiry on each request. No DB hit.

## Refresh token

- **What:** an opaque random string (`randomBytes(32)`), **not** a JWT. Only its sha256 hash is stored in `refresh_tokens`.
- **Lives:** long (`JWT_REFRESH_TTL`, e.g. 7d).
- **Where:** set as an `httpOnly` cookie (`refresh_token`), scoped to `path=/api/auth`, `sameSite=strict`, `secure` in prod. JS never sees it.
- **Why in the DB:** it's stateful, so it *can* be revoked — logout flips `revoked_at`. On use, `/refresh` looks it up by hash and rejects if missing, revoked, or expired.
- **Why opaque + hashed:** no signature to trust and no secret to leak; a stolen DB row is a hash, not a usable token.

## The flow

```
register / login  →  access token (body) + refresh cookie set
protected request →  Bearer access token, JwtGuard verifies it
access expires    →  POST /refresh (cookie sent automatically) → new access token
logout            →  refresh token revoked in DB + cookie cleared
```

## Why two tokens at all

You want requests to be cheap (verify a JWT, no DB) **and** sessions to be revocable (kill a token on logout/theft). One token can't be both. So: a stateless access token for speed, a stateful refresh token for control.

## Note

`/refresh` is **static** — it mints a new access token but keeps the same refresh token. No rotation. Simpler, but a leaked refresh token stays valid until it expires or is revoked. Rotation is the upgrade path if that matters.
