# Recent Bets Not Showing - Troubleshooting Guide

## Issue
Bets placed through the UI are not appearing in the "Recent Bets" section on the market detail page.

## Root Cause
The recent bets feature requires **Supabase** to be configured. If Supabase is not set up, bets won't be saved or displayed.

## How to Check if Supabase is Configured

### 1. Check Browser Console
After placing a bet, open DevTools console and look for:

**If Supabase is working:**
```
✅ Bet history saved to Supabase
✅ Volume snapshot saved to Supabase
```

**If Supabase is NOT configured:**
```
⚠️ Supabase not configured - bet history not saved
⚠️ Supabase not configured. Comments and charts will not work.
```

### 2. Check Environment Variables
Look in your `.env.local` file for:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

If these are missing or empty, Supabase is not configured.

## Solution: Set Up Supabase

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose organization, set project name
5. Set database password (save it!)
6. Wait for project to finish setting up (~2 minutes)

### Step 2: Get API Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Add to Environment Variables
Add to your `.env.local` file:
```bash
# Supabase Configuration (for bet history, comments, charts)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

### Step 4: Create Database Tables
Run the SQL schema in Supabase SQL Editor:

Go to **SQL Editor** → **New Query** and paste:

```sql
-- User Bet History Table
CREATE TABLE IF NOT EXISTS user_bet_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('yes', 'no', 'option')),
  option_index INTEGER,
  amount TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bet_history_card_id ON user_bet_history(card_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_user_address ON user_bet_history(user_address);
CREATE INDEX IF NOT EXISTS idx_bet_history_timestamp ON user_bet_history(timestamp DESC);

-- Card Volume Snapshots Table
CREATE TABLE IF NOT EXISTS card_volume_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id INTEGER NOT NULL,
  yes_volume TEXT NOT NULL,
  no_volume TEXT NOT NULL,
  tx_hash TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_volume_card_timestamp ON card_volume_snapshots(card_id, timestamp DESC);

-- Comments Table (if needed)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for comments
CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_bet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_volume_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read/write (adjust as needed)
CREATE POLICY "Allow public read on bet history" ON user_bet_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bet history" ON user_bet_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on volume snapshots" ON card_volume_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert on volume snapshots" ON card_volume_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on comments" ON comments FOR UPDATE USING (true);
```

Click **Run** to execute the SQL.

### Step 5: Restart Development Server
```bash
npm run dev
```

### Step 6: Test
1. Place a bet on any market
2. Check browser console for success messages
3. Refresh the market detail page
4. Recent bets should now appear in the "Recent Bets" box

## Alternative: Local Testing Without Supabase

If you don't want to set up Supabase right now, the betting still works! The only features that won't work are:

- ❌ Recent bets display
- ❌ Betting charts/graphs
- ❌ Comments section
- ✅ Core betting functionality (still works!)
- ✅ Resolution system (still works!)
- ✅ All blockchain features (still work!)

The app is designed to work without Supabase - it just won't have these optional analytics features.

## Verify Supabase is Working

After setup, place a test bet and check:

1. **Browser Console** - Should see:
   ```
   ✅ Bet history saved to Supabase
   ✅ Volume snapshot saved to Supabase
   ```

2. **Supabase Dashboard** - Go to **Table Editor**:
   - `user_bet_history` should have new rows
   - `card_volume_snapshots` should have new rows

3. **Recent Bets UI** - Market detail page should show:
   - Your bet in the "Recent Bets" list
   - Address, amount, side, and time

## Common Issues

### Issue: "relation 'user_bet_history' does not exist"
**Fix:** Run the SQL schema in Step 4 above

### Issue: "permission denied for table user_bet_history"
**Fix:** Check RLS policies - make sure public read/write is enabled

### Issue: Still not showing after setup
**Fix:** 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors
4. Verify env vars are correct (restart dev server)

## For Vercel Deployment

Don't forget to add environment variables in Vercel:

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy

## Summary

✅ **Improved Error Handling** - Better console logs  
✅ **Supabase Check** - Won't crash if not configured  
📝 **Setup Guide** - Complete instructions above  
🔧 **Optional Feature** - App works without it  

The betting functionality works perfectly without Supabase - it's only needed for the "Recent Bets" analytics feature!

