-- Up Migration
ALTER TABLE trades RENAME COLUMN size TO lots;
ALTER TABLE trades RENAME COLUMN r TO risk_reward;

-- Down Migration
ALTER TABLE trades RENAME COLUMN lots TO size;
ALTER TABLE trades RENAME COLUMN risk_reward TO r;
