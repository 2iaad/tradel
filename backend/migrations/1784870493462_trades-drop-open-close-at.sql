-- Up Migration
ALTER TABLE trades
    DROP COLUMN opened_at,
    DROP COLUMN closed_at;

-- Down Migration
ALTER TABLE trades
    ADD COLUMN opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN closed_at TIMESTAMPTZ;