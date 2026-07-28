-- Up Migration
CREATE TABLE trades (
    id          UUID    PRIMARY KEY DEFAULT     gen_random_uuid(),
    account_id  UUID    NOT NULL                REFERENCES accounts(id) ON DELETE CASCADE,
    symbol      VARCHAR(20)  NOT NULL,          -- XAU/USD
    side        VARCHAR(5)   NOT NULL,          -- 'LONG' | 'SHORT'
    entry       NUMERIC      NOT NULL,          -- 4000
    exit        NUMERIC,                        -- 4010
    size        NUMERIC      NOT NULL,
    r           NUMERIC,
    pnl         NUMERIC,                        -- +30$ || -30$
    opened_at   TIMESTAMPTZ  NOT NULL,          -- TIME
    closed_at   TIMESTAMPTZ,                    -- TIME
    created_at  TIMESTAMPTZ  NOT NULL       DEFAULT NOW(),
    -- lets the notes table point a foreign key at the pair (id, account_id).
    -- harmless: id is already the primary key, so every pair is unique anyway.
    UNIQUE (id, account_id)
);

CREATE INDEX idx_trades_account_id ON trades (account_id);

-- Down Migration
DROP TABLE trades;