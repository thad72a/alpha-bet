# Supabase Setup Guide

## Quick Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Wait for database to initialize

### 2. Run Migrations

In the Supabase SQL Editor, run these migrations in order:

#### Migration 1: Comments
```sql
-- Run: 001_create_comments_table.sql
```

#### Migration 2: User Bet History
```sql
-- Run: 002_create_user_bet_history.sql
```

#### Migration 3: Volume Snapshots (NEW)
```sql
-- Run: 003_add_card_volume_snapshots.sql
```

### 3. Get API Credentials

From your Supabase project settings:
1. Go to Settings → API
2. Copy **Project URL**
3. Copy **anon public** key

### 4. Configure Environment Variables

#### Local Development (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Vercel Deployment
Add these in Vercel dashboard:
- Project Settings → Environment Variables
- Add both variables for Production, Preview, and Development

### 5. Verify Setup

The app will show this warning if not configured:
```
⚠️  Supabase not configured. Comments and charts will not work.
```

Once configured properly, the warning disappears and features work.

## Database Tables Overview

### 1. `comments`
- Stores user comments on betting cards
- Real-time updates via subscriptions

### 2. `user_bet_history`
- Individual bet transactions
- User address, amount, type (YES/NO/option)
- Transaction hash for verification

### 3. `card_volume_snapshots` (NEW)
- Cumulative betting volumes over time
- Enables real-time chart data
- One entry per bet transaction

## Enable Row Level Security (RLS)

For production, enable RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_volume_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON comments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON user_bet_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON card_volume_snapshots FOR SELECT USING (true);

-- Allow authenticated insert
CREATE POLICY "Authenticated insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON user_bet_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON card_volume_snapshots FOR INSERT WITH CHECK (true);
```

## Troubleshooting

### Chart Shows Mock Data
- Check if table `card_volume_snapshots` exists
- Verify environment variables are set
- Place a test bet to generate first snapshot

### Comments Not Saving
- Check Supabase connection in browser console
- Verify table `comments` exists and has correct schema
- Check if wallet is connected

### Build Warnings
The build can complete successfully even without Supabase configured. Features will gracefully degrade:
- Charts show fallback mock data
- Comments feature is disabled
- No errors, just warnings

## Testing

### Test Volume Tracking
1. Deploy with Supabase configured
2. Place a bet on any card
3. Refresh the market detail page
4. Chart should show real data point

### Test Comments
1. Connect wallet
2. Navigate to market detail
3. Post a comment
4. Should appear immediately

## Next Steps

Once setup is complete:
1. Monitor database usage in Supabase dashboard
2. Set up backups if needed
3. Consider adding indexes for performance
4. Enable RLS policies for production security

