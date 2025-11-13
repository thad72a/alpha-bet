# Price Tracker Cron Job Setup

This guide explains how to set up the automated price tracking system that records alpha prices hourly to Supabase for historical charts.

## 📋 Overview

The price tracker:
- Fetches current alpha prices from the Bittensor backend
- Stores them in Supabase `price_history` table
- Runs automatically via cron job (recommended: every 5-15 minutes)
- Powers the historical price charts on market detail pages

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
cd /home/unicorn/alpha-bet
npm install dotenv
```

(The other dependencies like `@supabase/supabase-js` are already installed)

### Step 2: Get Supabase Service Key

1. Go to your Supabase project dashboard
2. Click **"Settings"** (gear icon)
3. Click **"API"**
4. Find **"service_role"** key (NOT the anon key)
5. Copy it (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

⚠️ **IMPORTANT**: The service role key has full database access. Keep it secret!

### Step 3: Add Service Key to Environment

Add to `.env.local`:

```bash
# Supabase Service Role Key (for cron job only - keep secret!)
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Backend URL (already configured)
BACKEND_URL=http://161.97.128.68:8000
```

### Step 4: Test the Script Manually

```bash
cd /home/unicorn/alpha-bet
node scripts/price-tracker-cron.js
```

You should see:
```
🕒 [2025-11-12T...] Starting price tracker...
📊 Found 64 subnets
✅ Stored price for subnet 1: 173553.5 TAO
✅ Stored price for subnet 2: 12345.2 TAO
...
✨ Price tracking complete!
```

### Step 5: Verify Data in Supabase

1. Go to Supabase dashboard
2. Click **"Table Editor"**
3. Select `price_history` table
4. You should see new rows with current prices

## ⏰ Setup Automated Cron Job

### Option 1: Linux/Mac Cron (Recommended for Production)

1. Create logs directory:
```bash
mkdir -p /home/unicorn/alpha-bet/logs
```

2. Open crontab:
```bash
crontab -e
```

3. Add this line (runs every 15 minutes):
```cron
*/15 * * * * cd /home/unicorn/alpha-bet && node scripts/price-tracker-cron.js >> logs/price-tracker.log 2>&1
```

Or for every 5 minutes (more granular data):
```cron
*/5 * * * * cd /home/unicorn/alpha-bet && node scripts/price-tracker-cron.js >> logs/price-tracker.log 2>&1
```

4. Save and exit (`:wq` in vim, or `Ctrl+X` then `Y` in nano)

5. Verify cron is active:
```bash
crontab -l
```

6. Check logs:
```bash
tail -f /home/unicorn/alpha-bet/logs/price-tracker.log
```

### Option 2: PM2 (Alternative - for always-running services)

If you want the script to run on a schedule via PM2:

1. Install PM2:
```bash
npm install -g pm2
```

2. Create PM2 config (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'price-tracker',
    script: 'scripts/price-tracker-cron.js',
    cron_restart: '*/15 * * * *', // Every 15 minutes
    autorestart: false,
    watch: false
  }]
}
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup # Follow instructions to auto-start on reboot
```

### Option 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily, repeat every 15 minutes
4. Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\alpha-bet\scripts\price-tracker-cron.js`
   - Start in: `C:\path\to\alpha-bet`

### Option 4: GitHub Actions (Cloud-based, free)

Create `.github/workflows/price-tracker.yml`:

```yaml
name: Price Tracker

on:
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes
  workflow_dispatch: # Manual trigger

jobs:
  track-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/price-tracker-cron.js
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          BACKEND_URL: http://161.97.128.68:8000
```

Then add secrets in GitHub repo settings.

## 📊 Monitoring

### Check if Cron is Running

```bash
# View cron log
tail -f /home/unicorn/alpha-bet/logs/price-tracker.log

# Check if process is running
ps aux | grep price-tracker-cron

# Check recent Supabase entries
# (In Supabase dashboard, query: SELECT * FROM price_history ORDER BY timestamp DESC LIMIT 10)
```

### Troubleshooting

**Problem**: "Error: Supabase credentials not found"
- **Fix**: Make sure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

**Problem**: "Failed to fetch subnet data"
- **Fix**: Check if backend is running at `http://161.97.128.68:8000/subnets`
- Test: `curl http://161.97.128.68:8000/subnets`

**Problem**: "Error storing price"
- **Fix**: Check Supabase dashboard for table schema
- Make sure `price_history` table exists with correct columns
- Verify service key has INSERT permissions

**Problem**: Cron not running
- **Fix**: Check cron service is running: `sudo service cron status`
- Check cron logs: `grep CRON /var/log/syslog`

## 🎯 Data Retention

By default, all price history is kept forever. If you want to limit storage:

### Option 1: Add Retention Policy in Supabase

Go to SQL Editor and run:

```sql
-- Delete price history older than 90 days
CREATE OR REPLACE FUNCTION delete_old_price_history()
RETURNS void AS $$
BEGIN
  DELETE FROM price_history
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Run daily at midnight
SELECT cron.schedule(
  'delete-old-price-history',
  '0 0 * * *',
  'SELECT delete_old_price_history();'
);
```

### Option 2: Manual Cleanup Script

```bash
# Delete data older than 90 days
echo "DELETE FROM price_history WHERE timestamp < NOW() - INTERVAL '90 days';" | \
  psql $DATABASE_URL
```

## 📈 Performance Tips

1. **Frequency**: 
   - 5-15 minutes is ideal for intraday charts
   - Hourly is sufficient for longer timeframes

2. **Storage**:
   - ~150 KB per subnet per month (15-min intervals)
   - ~5 MB per subnet per year
   - For 64 subnets: ~320 MB per year

3. **Optimization**:
   - Add indexes on `(netuid, timestamp)` (already in schema)
   - Use Supabase connection pooling for high-frequency updates

## 🎉 Verification

After setup, verify everything works:

1. **Wait 15-20 minutes** for first cron run
2. Go to any market detail page
3. Click on chart timeframe buttons (24h, 7d, etc.)
4. You should see real price data instead of mock data

**Note**: Charts will show mock data until you have at least 2 data points in the database.

## 📝 Maintenance

- **Monitor logs**: Check `/home/unicorn/alpha-bet/logs/price-tracker.log` weekly
- **Database size**: Monitor Supabase dashboard for storage usage
- **Uptime**: Ensure cron/PM2 is always running

---

**Questions?** Check the main project README or open an issue on GitHub.

