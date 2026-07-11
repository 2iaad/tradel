-- Up Migration
CREATE TABLE trades (
    id          UUID    PRIMARY KEY DEFAULT     gen_random_uuid(),
    account_id  UUID    NOT NULL                REFERENCES accounts(id) ON DELETE CASCADE,
    symbol      VARCHAR(20)  NOT NULL,
    side        VARCHAR(5)   NOT NULL,   -- 'LONG' | 'SHORT'
    entry       NUMERIC      NOT NULL,
    exit        NUMERIC,
    size        NUMERIC      NOT NULL,
    r           NUMERIC,
    pnl         NUMERIC,
    opened_at   TIMESTAMPTZ  NOT NULL,
    closed_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL       DEFAULT NOW()
);

CREATE INDEX idx_trades_account_id ON trades (account_id);

-- Down Migration
DROP TABLE trades;