# Betting Volume Tracking Implementation

## Overview
The chart now displays **real betting volume data** instead of mock/synthetic data. Every time a user places a bet, the system records a snapshot of the cumulative YES and NO volumes.

## How It Works

### 1. **Data Recording**
When a bet transaction is confirmed:
- The system calculates the new cumulative YES and NO volumes
- Records a snapshot to Supabase `card_volume_snapshots` table
- Includes the transaction hash for verification

### 2. **Data Display**
The chart (`MarketChart.tsx`):
- Fetches real volume history from Supabase
- Displays YES (green) and NO (red) betting volume growth over time
- Falls back to mock data if no real data exists yet (for new cards)

### 3. **Automatic Tracking**
Volume is recorded in:
- `BettingModal.tsx` - Homepage betting modal
- `TradingPanel.tsx` - Market detail page trading panel

## Database Setup

### Supabase Table Structure

```sql
CREATE TABLE card_volume_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id INTEGER NOT NULL,
  yes_volume TEXT NOT NULL,
  no_volume TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Setup Instructions

1. **In Supabase Dashboard:**
   - Go to your project's SQL Editor
   - Run the migration file: `supabase/migrations/003_add_card_volume_snapshots.sql`

2. **Or use Supabase CLI:**
   ```bash
   supabase db push
   ```

### Environment Variables

Make sure these are set in your Vercel/deployment environment:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Features

### Real-Time Chart
- Shows actual betting activity over time
- Separate lines for YES (green) and NO (red)
- Timeframe filters: 24h, 7d, 30d, all
- Smooth gradients and tooltips

### Fallback System
- New cards without betting history show mock data
- As soon as first bet is placed, chart switches to real data
- Provides good UX even for brand new markets

### Data Precision
- Volumes stored as strings to preserve decimal precision
- All calculations done in TAO (not wei)
- Transaction hash linking for auditability

## API Functions

### Recording Snapshots
```typescript
recordVolumeSnapshot(
  cardId: number,
  yesVolume: string,
  noVolume: string,
  txHash: string
): Promise<boolean>
```

### Fetching History
```typescript
getVolumeHistory(
  cardId: number,
  timeRange: '24h' | '7d' | '30d' | 'all'
): Promise<CardVolumeSnapshot[]>
```

## Benefits

1. **Transparency** - Users can see real betting patterns
2. **Trust** - All data tied to blockchain transactions
3. **Insights** - Track market sentiment changes over time
4. **Analytics** - Foundation for future analytics features

## Future Enhancements

Possible improvements:
- Add volume change rate indicators
- Show betting velocity (bets per hour)
- Highlight unusual volume spikes
- Export data for external analysis
- Add moving averages and trends

