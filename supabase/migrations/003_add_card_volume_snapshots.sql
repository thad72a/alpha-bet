-- Create card_volume_snapshots table to track betting volume history
CREATE TABLE IF NOT EXISTS card_volume_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id INTEGER NOT NULL,
  yes_volume TEXT NOT NULL, -- Cumulative YES volume in TAO (stored as text to preserve precision)
  no_volume TEXT NOT NULL, -- Cumulative NO volume in TAO (stored as text to preserve precision)
  tx_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for efficient queries
  CONSTRAINT card_volume_snapshots_unique_tx UNIQUE (tx_hash)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_card_volume_snapshots_card_id ON card_volume_snapshots(card_id);
CREATE INDEX IF NOT EXISTS idx_card_volume_snapshots_timestamp ON card_volume_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_card_volume_snapshots_card_timestamp ON card_volume_snapshots(card_id, timestamp);

-- Add comment for documentation
COMMENT ON TABLE card_volume_snapshots IS 'Tracks cumulative YES and NO betting volumes for each card over time';
COMMENT ON COLUMN card_volume_snapshots.yes_volume IS 'Cumulative YES betting volume in TAO';
COMMENT ON COLUMN card_volume_snapshots.no_volume IS 'Cumulative NO betting volume in TAO';
COMMENT ON COLUMN card_volume_snapshots.tx_hash IS 'Transaction hash that triggered this snapshot';

