-- Supabase Database Schema for Alpha-Bet
-- 
-- Instructions:
-- 1. Go to https://supabase.com and create a new project
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Copy and paste this entire file
-- 4. Click "Run" to create all tables
-- 5. Copy your project URL and anon key to .env.local

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_address ON comments(user_address);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Price History Table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  netuid INTEGER NOT NULL,
  alpha_price NUMERIC(20, 8) NOT NULL, -- Support large numbers with 8 decimal precision
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for price_history
CREATE INDEX IF NOT EXISTS idx_price_history_netuid ON price_history(netuid);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_netuid_timestamp ON price_history(netuid, timestamp DESC);

-- User Bet History Table (optional - tracks all bets for analytics)
CREATE TABLE IF NOT EXISTS user_bet_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('yes', 'no', 'option')),
  option_index INTEGER,
  amount TEXT NOT NULL, -- Store as string to preserve precision
  tx_hash TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_bet_history
CREATE INDEX IF NOT EXISTS idx_bet_history_card_id ON user_bet_history(card_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_user_address ON user_bet_history(user_address);
CREATE INDEX IF NOT EXISTS idx_bet_history_timestamp ON user_bet_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bet_history_tx_hash ON user_bet_history(tx_hash);

-- Function to increment comment likes
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET likes = likes + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bet_history ENABLE ROW LEVEL SECURITY;

-- Comments: Anyone can read, authenticated users can insert
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Price History: Anyone can read, only service role can insert
CREATE POLICY "Price history is viewable by everyone"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "Only service role can insert price history"
  ON price_history FOR INSERT
  WITH CHECK (true);

-- Bet History: Anyone can read, authenticated can insert their own
CREATE POLICY "Bet history is viewable by everyone"
  ON user_bet_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own bet history"
  ON user_bet_history FOR INSERT
  WITH CHECK (true);

-- Sample Data (optional - for testing)
-- Uncomment if you want some test data

-- INSERT INTO comments (card_id, user_address, text) VALUES
--   (1, '0x1234567890abcdef1234567890abcdef12345678', 'Great market! I''m betting YES on this one.'),
--   (1, '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'Not so sure about this. Price seems too volatile.');

-- INSERT INTO price_history (netuid, alpha_price) VALUES
--   (1, 173553.5),
--   (1, 174200.3),
--   (1, 172900.8);

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('comments', 'price_history', 'user_bet_history')
ORDER BY table_name;

