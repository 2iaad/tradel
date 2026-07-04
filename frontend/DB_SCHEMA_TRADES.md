# New tables needed — accounts, trades, journal notes

Current DB only has `users` and `refresh_tokens`. To support multiple
trading accounts per user, with trades and journal notes attached to them,
we need 3 new tables.

## Relationship diagram

```
┌───────────────┐
│    users      │
│───────────────│
│ id  (PK)      │
│ username      │
│ email         │
│ password_hash │
└───────┬───────┘
        │ 1
        │
        │ owns many
        │
        │ *
┌───────▼───────┐
│   accounts    │
│───────────────│
│ id       (PK) │
│ user_id  (FK) │───────┐  references users.id
│ name          │
│ broker        │
│ currency      │
│ created_at    │
└───────┬───────┘
        │ 1
        │
        ├─────────────────────┐
        │ has many            │ has many
        │ *                   │ *
┌───────▼───────┐      ┌──────▼────────┐
│    trades     │      │ journal_notes │
│───────────────│      │───────────────│
│ id        (PK)│      │ id        (PK)│
│ account_id(FK)│──┐   │ account_id(FK)│──┐
│ symbol        │  │   │ title         │  │
│ side          │  │   │ body          │  │
│ entry         │  │   │ tags          │  │
│ exit          │  │   │ trade_id  (FK)│──┼──┐  nullable, references trades.id
│ size          │  │   │ created_at    │  │  │
│ r             │  │   └───────────────┘  │  │
│ pnl           │  │                      │  │
│ opened_at     │  │                      │  │
│ closed_at     │  │                      │  │
│ created_at    │  │                      │  │
└───────────────┘  │                      │  │
        ▲          │                      │  │
        └──────────┴──────────────────────┴──┘
           references accounts.id      optional link:
                                        a note can be
                                        about one trade
```

## Plain-English relationships

- **One user → many accounts.** A user can have "FTMO 100k", "Personal
  live", "Demo", etc. Delete the user, all their accounts go too (cascade).
- **One account → many trades.** A trade always belongs to exactly one
  account, never directly to a user. Delete an account, all its trades go
  too (cascade).
- **One account → many journal notes.** Same idea — a note belongs to an
  account (so notes can be scoped/filtered per account like trades are).
- **One trade → many journal notes (optional).** A note can optionally
  point at a specific trade (`trade_id`), e.g. "why I took this exact
  trade". If the trade is deleted, the note stays but the link is cleared
  (`ON DELETE SET NULL`), not deleted — a note is still worth keeping.

## Table definitions (SQL, style-matched to existing migrations)

```sql
CREATE TABLE accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(60)  NOT NULL,
    broker      VARCHAR(60),
    currency    VARCHAR(3)   NOT NULL DEFAULT 'USD',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts (user_id);


CREATE TABLE trades (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol      VARCHAR(20)  NOT NULL,
    side        VARCHAR(5)   NOT NULL,   -- 'LONG' | 'SHORT'
    entry       NUMERIC      NOT NULL,
    exit        NUMERIC,
    size        NUMERIC      NOT NULL,
    r           NUMERIC,                  -- risk multiple, null until closed
    pnl         NUMERIC,                  -- null until closed
    opened_at   TIMESTAMPTZ  NOT NULL,
    closed_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_account_id ON trades (account_id);


CREATE TABLE journal_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    trade_id    UUID         REFERENCES trades(id) ON DELETE SET NULL,
    title       VARCHAR(120) NOT NULL,
    body        TEXT         NOT NULL,
    tags        TEXT[]       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_notes_account_id ON journal_notes (account_id);
CREATE INDEX idx_journal_notes_trade_id ON journal_notes (trade_id);
```

## Ownership check (used everywhere)

Since `trades` and `journal_notes` don't store `user_id` directly, every
read/write goes through the account:

```sql
-- does this account belong to the logged-in user?
SELECT 1 FROM accounts WHERE id = $accountId AND user_id = $sessionUserId;
```

One check, reused by every trades/journal endpoint. No duplicated
ownership logic.
