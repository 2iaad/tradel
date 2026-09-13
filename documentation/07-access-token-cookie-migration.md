# Move the Access Token to an HttpOnly Cookie

## Goal

- Stop sending the access token in the response body.
- Stop using the `Authorization` header.
- Store both tokens in `HttpOnly` cookies.
- Keep the access token short-lived.
- Keep the refresh token only for refreshing the access token.

## Final flow

1. Login or registration sets two cookies.
2. The browser sends the access cookie with API requests.
3. `JwtGuard` verifies the access cookie.
4. When it expires, the frontend calls `/api/auth/refresh`.
5. Refresh sets a new access cookie.
6. Logout revokes the refresh token and clears both cookies.

## 1. Add the access cookie ✅

Status: Done

File: `apps/api/src/auth/auth.controller.ts`

- Add an `access_token` cookie name.
- Add a `setAccessCookie()` helper.
- Use these settings:
    - `httpOnly: true`
    - `secure: true` in production
    - `path: '/api'`
    - `maxAge`: the access-token TTL
    - `sameSite: 'strict'` when the web app and API are same-site
- If production uses different sites, `SameSite=None` is required. Add CSRF protection before deployment.
- Set the access cookie after register, login, and refresh.
- Do not return the access token in JSON.

Expected responses:

- Register: `201` with no token.
- Login: `200` with no token.
- Refresh: `204` with a new access cookie.
- Logout: `204` after clearing both cookies.

## 2. Read the access cookie in the guard ✅

Status: Done

File: `apps/api/src/auth/guards/jwt.guard.ts`

- Read `req.cookies.access_token`.
- Reject the request when the cookie is missing.
- Verify the JWT as before.
- Keep assigning the verified payload to `req.user`.
- Remove the `Authorization: Bearer` parsing code.

## 3. Add a current-user endpoint ✅

Status: Done

File: `apps/api/src/auth/auth.controller.ts`

- Add `GET /api/auth/me`.
- Protect it with `JwtGuard`.
- Return only safe user data:

```json
{
    "id": "user-id",
    "email": "user@example.com"
}
```

The frontend needs this endpoint because JavaScript cannot read an `HttpOnly` access cookie.

## 4. Clear both cookies on logout ✅

Status: Done

File: `apps/api/src/auth/auth.controller.ts`

- Revoke the refresh token in the database.
- Clear `access_token` with `path: '/api'`.
- Clear `refresh_token` with `path: '/api/auth'`.
- Use the same cookie names and paths used when setting them.

## 5. Remove frontend token storage ✅

Status: Done

File: `apps/web/src/lib/api.ts`

- Keep `withCredentials: true`.
- Delete the in-memory `accessToken` variable.
- Delete `setAccessToken()` and `getAccessToken()`.
- Delete the request interceptor that adds the `Authorization` header.
- Keep the response interceptor.
- On a `401`, call `/auth/refresh`, then retry the original request.
- Do not try to refresh failed login, register, refresh, or logout requests.
- Allow a failed `/auth/me` request to use the refresh flow.

## 6. Update the session store ✅

Status: Done

File: `apps/web/src/stores/session.ts`

- Remove every call to `setAccessToken()` and `getAccessToken()`.
- Change `restore()` to call `GET /auth/me`.
- Set the session to `user` when `/auth/me` succeeds.
- Set the session to `anon` when it fails after the refresh attempt.
- Keep calling `/auth/logout` in `signOut()`.

## 7. Update login and registration ✅

Status: Done

File: `apps/web/src/app/(auth)/layout.tsx`

- Stop reading `data.accessToken`.
- Stop calling `setAccessToken()`.
- After login or registration succeeds, call `restore()`.
- Redirect to `/dashboard` after `restore()` succeeds.
- Redirect logged-in users away from `/login`, `/register`, and `/reset`.

## 8. Update API documentation ✅

Status: Done (`JWT_REFRESH_SECRET` kept as requested)

Files:

- `apps/api/src/main.ts`
- `documentation/04-db-and-auth.md`

- Replace Swagger bearer authentication with cookie authentication.
- Update the documented login, refresh, logout, and protected-request flows.
- Keep `JWT_REFRESH_SECRET` unchanged for now.

## 9. Test the migration

- Login sets both cookies.
- Neither cookie is readable through `document.cookie`.
- Protected requests work without an `Authorization` header.
- Missing or expired access cookies return `401`.
- A valid refresh cookie creates a new access cookie.
- An invalid or revoked refresh cookie returns `401`.
- Logout clears both cookies and revokes the refresh token.
- Reloading the browser keeps the user logged in.
- Visiting `/login` while logged in redirects to `/dashboard`.
- User A cannot access User B's data.

## Security requirement

Moving the access token into a cookie makes all protected write requests vulnerable to CSRF.

Do not deploy this migration until CSRF protection and `Origin` checks are active for `POST`, `PUT`, `PATCH`, and `DELETE` requests.
