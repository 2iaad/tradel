-- Up Migration
ALTER TABLE accounts
    ADD COLUMN starting_balance NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Down Migration
ALTER TABLE accounts DROP COLUMN starting_balance;