# Supabase Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (or email)
4. Click "New Project"
5. Fill in:
   - **Name**: `alpha-bet` (or any name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (500MB database, 2GB bandwidth)
6. Click "Create new project"
7. Wait 2-3 minutes for project to be ready

### Step 2: Run Database Schema

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open `supabase/schema.sql` in this repo
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. You should see: ✅ Success. No rows returned

### Step 3: Get API Credentials

1. Click **"Settings"** (gear icon, left sidebar)
2. Click **"API"**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public** key (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 4: Add to Environment Variables

1. Open `/home/unicorn/alpha-bet/.env.local`
2. Add these lines:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace with your actual URL and key
4. Save the file

### Step 5: Install Supabase Package

```bash
cd /home/unicorn/alpha-bet
npm install @supabase/supabase-js
```

### Step 6: Restart Next.js Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## ✅ Verify It Works

### Check Database Tables

1. In Supabase dashboard, click **"Table Editor"**
2. You should see 3 tables:
   - `comments`
   - `price_history`
   - `user_bet_history`

### Test Connection

Add this to any page temporarily:

```typescript
import { supabase } from '@/lib/supabase'

// Test in useEffect
useEffect(() => {
  async function test() {
    const { data, error } = await supabase
      .from('comments')
      .select('count')
    
    console.log('Supabase connected:', !error)
  }
  test()
}, [])
```

## 📊 Database Schema

### Comments Table
```sql
- id (UUID, primary key)
- card_id (INTEGER) - References betting card
- user_address (TEXT) - Ethereum address
- text (TEXT) - Comment content
- parent_id (UUID) - For nested replies
- likes (INTEGER) - Like count
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Price History Table
```sql
- id (UUID, primary key)
- netuid (INTEGER) - Bittensor subnet ID
- alpha_price (NUMERIC) - Alpha price at that time
- timestamp (TIMESTAMP)
```

### User Bet History Table
```sql
- id (UUID, primary key)
- card_id (INTEGER)
- user_address (TEXT)
- bet_type (TEXT) - 'yes', 'no', or 'option'
- option_index (INTEGER) - For multi-option bets
- amount (TEXT) - TAO amount
- tx_hash (TEXT) - Transaction hash
- timestamp (TIMESTAMP)
```

## 🔒 Security (Row Level Security)

All tables have RLS enabled with these policies:

- **Comments**: Everyone can read, anyone can create
- **Price History**: Everyone can read, only backend can write
- **Bet History**: Everyone can read, anyone can create

## 📈 Usage in Code

### Fetch Comments
```typescript
import { getComments } from '@/lib/supabase'

const comments = await getComments(cardId)
```

### Add Comment
```typescript
import { addComment } from '@/lib/supabase'

const comment = await addComment(
  cardId,
  userAddress,
  'Great market!'
)
```

### Get Price History
```typescript
import { getPriceHistory } from '@/lib/supabase'

const prices = await getPriceHistory(netuid, '7d')
```

### Real-time Updates
```typescript
import { subscribeToComments } from '@/lib/supabase'

const subscription = subscribeToComments(cardId, (newComment) => {
  console.log('New comment:', newComment)
  // Update UI
})

// Cleanup
return () => subscription.unsubscribe()
```

## 🛠️ Troubleshooting

### Error: "Invalid API key"
- Make sure you copied the **anon/public** key (not service_role)
- Check for extra spaces in .env.local

### Error: "relation does not exist"
- Run the schema.sql again in SQL Editor
- Check that all tables were created in Table Editor

### Error: "Row Level Security policy violation"
- This is normal for some operations
- Check RLS policies in Supabase dashboard under Authentication > Policies

### Comments not showing
- Check browser console for errors
- Verify Supabase URL and key are correct
- Test connection with simple query

## 🎯 Next Steps

Once Supabase is set up:

1. ✅ Comments will work on market detail pages
2. ✅ Price charts will show historical data
3. ✅ Real-time updates when new comments are posted
4. ✅ Track user betting history

## 💰 Cost

**Free Tier includes:**
- 500MB database storage
- 1GB file storage
- 2GB bandwidth per month
- 50,000 monthly active users

This is **more than enough** for testing and initial launch!

**Upgrade needed when:**
- Database > 500MB (lots of comments/price history)
- Bandwidth > 2GB/month (high traffic)
- Free tier: ~$0/month
- Pro tier: ~$25/month (only if you outgrow free)

## 📚 Resources

- Supabase Docs: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript
- Real-time: https://supabase.com/docs/guides/realtime

