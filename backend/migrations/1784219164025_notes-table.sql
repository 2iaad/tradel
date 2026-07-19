-- Up Migration
CREATE TABLE notes (
    id          UUID        PRIMARY KEY     DEFAULT gen_random_uuid(),
    account_id  UUID        NOT NULL,
    trade_id    UUID        NOT NULL,
    title       VARCHAR(50) NOT NULL,
    body        TEXT        NOT NULL,
    tags        TEXT[]                      DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL        DEFAULT NOW(),
    -- this to make sure notes have the same account id as trades, here we are comparing as you see
    -- so we are comparing (trade_id, account_id) from notes TABLE with ----->  (id, account_id) on trades TABLE
    FOREIGN KEY (trade_id, account_id) REFERENCES trades (id, account_id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_account_id ON notes (account_id);
CREATE INDEX idx_notes_trade_id ON notes (trade_id);

-- Down Migration
DROP TABLE notes;
