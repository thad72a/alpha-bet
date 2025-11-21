# Debug Recent Bets Issue

## Quick Checks

### 1. Check Browser Console After Placing Bet

Look for these messages in order:
```
✅ Bet history saved to Supabase
✅ Volume snapshot saved to Supabase
📊 Fetched X recent bets for card Y
```

If you see:
- ✅ All three messages → Data is saving and loading correctly
- ⚠️ "Failed to save bet history" → Supabase config or table issue
- 📊 "Fetched 0 recent bets" → Data is not in Supabase

### 2. Check Supabase Dashboard

1. Go to your Supabase project
2. Click **Table Editor** in sidebar
3. Look for table: `user_bet_history`

**If table doesn't exist:**
```sql
-- Create the table
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

CREATE INDEX IF NOT EXISTS idx_bet_history_card_id ON user_bet_history(card_id);
CREATE INDEX IF NOT EXISTS idx_bet_history_user_address ON user_bet_history(user_address);
CREATE INDEX IF NOT EXISTS idx_bet_history_timestamp ON user_bet_history(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE user_bet_history ENABLE ROW LEVEL SECURITY;

-- Allow public read/write
CREATE POLICY "Allow public read" ON user_bet_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON user_bet_history FOR INSERT WITH CHECK (true);
```

**If table exists but is empty:**
- Place a test bet
- Refresh the table in Supabase
- Check if new row appears

**If table has data but UI shows nothing:**
- Check RLS policies are enabled and allow public SELECT
- Check browser console for fetch errors

### 3. Test Supabase Connection

Open browser console and run:
```javascript
// Check if Supabase is configured
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

Should show:
```
Supabase URL: https://your-project.supabase.co
Supabase Key exists: true
```

### 4. Manual Test Query

In Supabase SQL Editor, run:
```sql
-- Check if table exists
SELECT * FROM user_bet_history LIMIT 10;

-- Check recent bets for a specific card
SELECT * FROM user_bet_history WHERE card_id = 1 ORDER BY timestamp DESC;

-- Count total bets
SELECT COUNT(*) FROM user_bet_history;
```

## Common Issues & Fixes

### Issue 1: Table Doesn't Exist
**Symptom:** Error in console about missing relation  
**Fix:** Run the CREATE TABLE SQL above in Supabase SQL Editor

### Issue 2: RLS Policies Blocking Reads
**Symptom:** Table exists but data doesn't load  
**Fix:** Check and create policies:
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'user_bet_history';

-- If none exist, create them
CREATE POLICY "Allow public read" ON user_bet_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON user_bet_history FOR INSERT WITH CHECK (true);
```

### Issue 3: Data Saving But Not Appearing
**Symptom:** Console shows "✅ Bet history saved" but UI empty  
**Possible causes:**
1. **Wrong card_id** - Check if card IDs match
2. **Cache issue** - Hard refresh (Ctrl+Shift+R)
3. **Race condition** - Wait 1-2 seconds after bet, then manually refresh

**Fix:** The recent code changes should fix the race condition by:
- Waiting for Supabase saves to complete
- Adding 500ms delay before page reload
- Better async/await handling

### Issue 4: Environment Variables Not Loaded
**Symptom:** No Supabase errors but nothing works  
**Fix:**
1. Check `.env.local` has correct values
2. Restart dev server: `npm run dev`
3. For production/Vercel: Add env vars in Vercel dashboard

## Testing Flow

1. **Place a bet** on any market
2. **Watch console** for:
   ```
   ✅ Bet history saved to Supabase
   ✅ Volume snapshot saved to Supabase
   ```
3. **Page reloads** automatically (wait for it)
4. **Check console** for:
   ```
   📊 Fetched X recent bets for card Y
   ```
5. **Look at UI** - Recent Bets section should show your bet

## Still Not Working?

### Step-by-Step Debug:

1. **Verify Supabase is actually configured:**
   ```bash
   # In terminal
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Check table exists and has data:**
   - Supabase → Table Editor → user_bet_history
   - Should see rows after placing bets

3. **Test the fetch function directly:**
   Open browser console:
   ```javascript
   // Import and test (only works if on the page)
   getUserBetHistory('', 1).then(bets => console.log('Bets:', bets))
   ```

4. **Check for TypeScript errors:**
   ```bash
   npm run build
   ```

5. **Clear all caches:**
   - Browser: Ctrl+Shift+Del → Clear cache
   - Next.js: `rm -rf .next`
   - Restart: `npm run dev`

## Expected Behavior After Fix

1. ✅ Bet transaction confirms on blockchain
2. ✅ Data saves to Supabase (see console log)
3. ✅ 500ms delay ensures write completes
4. ✅ Page reloads
5. ✅ OrderBook fetches fresh data
6. ✅ Recent bets display with your bet at the top

## Contact Points

If still not working, check:
- Browser console errors
- Supabase logs (Supabase → Logs)
- Network tab (look for failed requests to Supabase)

Share screenshots of:
1. Browser console after placing bet
2. Supabase table editor showing user_bet_history
3. Recent Bets UI section

