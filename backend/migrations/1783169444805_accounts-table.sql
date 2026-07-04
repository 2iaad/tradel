-- Up Migration

CREATE TABLE accounts (
    id          UUID PRIMARY KEY DEFAULT    gen_random_uuid(),
    user_id     UUID         NOT NULL       REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50)  NOT NULL,
    broker      VARCHAR(60),
    currency    VARCHAR(3)   NOT NULL DEFAULT 'USD',
    created_at  TIMESTAMPTZ  NOT NULL       DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_accounts_user_id_name ON accounts (user_id, name);

-- Down Migration
DROP TABLE accounts;