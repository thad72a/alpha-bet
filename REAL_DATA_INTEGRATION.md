# Real Data Integration Guide

## ✅ Complete! No More Mock Data

All mock data has been replaced with real data from the **Bittensor blockchain** and **Bittensor network**.

## 🎯 What Was Changed

### ❌ Removed
- Mock betting card data in `app/page.tsx`
- Mock market data in `app/market/[id]/page.tsx`
- Hardcoded test cards and prices

### ✅ Added

#### 1. **Contract Hooks** (`lib/contract-hooks.ts`)
Fetch real data from the BettingCard smart contract:

```typescript
// Get all betting cards from blockchain
const { cards, count, isLoading } = useAllCards()

// Get a single card
const { card } = useCard(cardId)

// Get user's shares
const { shares } = useUserShares(userAddress, cardId)

// Get platform fee info
const { feePercentage } = usePlatformFee()
```

#### 2. **Card Helpers** (`lib/card-helpers.ts`)
Combine blockchain data with Bittensor subnet data:

```typescript
// Enrich card with real subnet prices
const enrichedCard = enrichCard(blockchainCard, subnetData)

// Filter cards by status
const activeCards = filterCards(cards, 'active')

// Sort cards
const sorted = sortCards(cards, 'volume')

// Calculate win payouts
const { yesWin, noWin } = calculatePayout(userYes, userNo, card)
```

#### 3. **Updated Main Page** (`app/page.tsx`)
Now uses real blockchain data:

```typescript
// Fetch from blockchain
const { cards: blockchainCards } = useAllCards()
const { summaries } = useSubnetSummaries()

// Combine blockchain + network data
const enrichedCards = useMemo(() => {
  return blockchainCards.map(card => 
    enrichCard(card, summaries[card.netuid])
  )
}, [blockchainCards, summaries])
```

## 📊 Data Sources

### 1. **Blockchain Data** (from BettingCard Contract)
Fetched via Wagmi hooks from Bittensor EVM:

- Card ID
- Subnet (netuid)
- Target alpha price
- Deadline timestamp
- Creator address
- YES/NO share totals
- Total liquidity
- Resolved status
- Card type (binary/multi)
- Option names (for multi-option cards)

### 2. **Bittensor Network Data** (from Backend)
Fetched via Python backend using `bittensor` SDK:

- **Current alpha price** ← Real-time subnet price
- Subnet name
- TAO emission rates
- Alpha in/out
- Owner information

**Backend endpoint**: `/subnets`
**Updates**: Every 30 seconds (configurable)

## 🔄 How It Works

### Data Flow

```
┌─────────────────┐
│  Bittensor EVM  │ ← Smart Contract (BettingCard.sol)
│   (Chain ID     │
│   945/966)      │
└────────┬────────┘
         │
         │ useAllCards() hook
         ▼
┌─────────────────────┐
│  Frontend React     │
│  (Next.js)          │
└─────────┬───────────┘
          │
          │ enrichCard()
          │ combines data
          ▼
┌─────────────────────────┐      ┌──────────────────┐
│  Enriched Card Data     │  ◄───│  Backend API     │
│  - Blockchain info      │      │  /subnets        │
│  - Real alpha prices    │      └────────┬─────────┘
│  - Calculated metrics   │               │
└─────────────────────────┘               │
                                          │ bittensor SDK
                                          ▼
                                ┌─────────────────────┐
                                │  Bittensor Network  │
                                │  (Finney/Testnet)   │
                                └─────────────────────┘
```

### Step-by-Step

1. **Page loads** → `useAllCards()` fetches all cards from blockchain
2. **Backend fetches** → Real subnet prices from Bittensor network
3. **Data enrichment** → `enrichCard()` combines both sources
4. **Display** → Show real-time betting cards with actual prices

## 🚀 Usage Examples

### Fetching Cards in a Component

```typescript
import { useAllCards } from '@/lib/contract-hooks'
import { useSubnetSummaries } from '@/components/SubnetProvider'
import { enrichCard } from '@/lib/card-helpers'

export function MyComponent() {
  const { cards, isLoading } = useAllCards()
  const { summaries } = useSubnetSummaries()
  
  const enrichedCards = useMemo(() => {
    return cards.map(card => 
      enrichCard(card, summaries[card.netuid] || null)
    )
  }, [cards, summaries])
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {enrichedCards.map(card => (
        <div key={card.id}>
          <h3>{card.question}</h3>
          <p>Current Price: {card.currentAlphaPrice} TAO</p>
          <p>Target Price: {card.bettedAlphaPrice} TAO</p>
          <p>Time Remaining: {formatTimeRemaining(card.timeRemaining)}</p>
        </div>
      ))}
    </div>
  )
}
```

### Displaying a Single Card

```typescript
import { useCard } from '@/lib/contract-hooks'
import { useSubnet } from '@/components/SubnetProvider'
import { enrichCard, formatTAO, formatPercentage } from '@/lib/card-helpers'

export function CardDetail({ cardId }: { cardId: number }) {
  const { card, isLoading } = useCard(cardId)
  const subnetData = useSubnet(card?.netuid || 0)
  
  if (isLoading || !card) return <div>Loading...</div>
  
  const enriched = enrichCard(card, subnetData)
  
  return (
    <div>
      <h2>{enriched.question}</h2>
      <p>Subnet: {enriched.subnetName || `Subnet ${enriched.netuid}`}</p>
      <p>Current Alpha: {formatTAO(enriched.currentAlphaPrice || 0)} TAO</p>
      <p>Target: {formatTAO(enriched.bettedAlphaPrice)} TAO</p>
      <p>Volume: {formatTAO(enriched.volume)} TAO</p>
      <p>YES: {formatPercentage(enriched.yesPercentage)}</p>
      <p>NO: {formatPercentage(enriched.noPercentage)}</p>
    </div>
  )
}
```

### Checking User Positions

```typescript
import { useUserShares } from '@/lib/contract-hooks'
import { formatEther } from 'viem'

export function UserPosition({ cardId }: { cardId: number }) {
  const { address } = useAccount()
  const { shares, isLoading } = useUserShares(address, cardId)
  
  if (isLoading || !shares) return null
  
  const yesAmount = parseFloat(formatEther(shares.yesShares))
  const noAmount = parseFloat(formatEther(shares.noShares))
  
  if (yesAmount === 0 && noAmount === 0) {
    return <p>You have no position in this market</p>
  }
  
  return (
    <div>
      <h3>Your Position</h3>
      <p>YES: {yesAmount.toFixed(4)} TAO</p>
      <p>NO: {noAmount.toFixed(4)} TAO</p>
      <p>Total: {(yesAmount + noAmount).toFixed(4)} TAO</p>
    </div>
  )
}
```

## 🔧 Backend Configuration

### Current Backend

The backend is already running and fetching real Bittensor data:

**URL**: `http://161.97.128.68:8000` (or `http://localhost:8000` if running locally)

**Endpoints**:
- `GET /subnets` - Get all subnet summaries with alpha prices
- `GET /subnets/{netuid}/info` - Get detailed info for one subnet
- `GET /health` - Health check

### Running Backend Locally

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server
python -m app.main
```

The backend fetches data from Bittensor's Finney network using the `bittensor` Python SDK.

### Customizing Cache Duration

In `backend/app/services/bittensor_client.py`:

```python
# Change TTL (time-to-live) for cache
_subnets_cache = TTLCache(maxsize=1, ttl=30)  # 30 seconds
_info_cache = TTLCache(maxsize=64, ttl=30)    # 30 seconds
```

## 📈 Available Contract Hooks

### Card Hooks
- `useCardCount()` - Total number of cards
- `useCard(id)` - Single card by ID
- `useCards(ids[])` - Multiple cards
- `useAllCards()` - All cards (fetches count first)

### User Hooks
- `useUserShares(address, cardId)` - User's YES/NO shares
- `useUserOptionStake(address, cardId, option)` - User's stake on specific option

### Option Hooks (Multi-Markets)
- `useOptionNames(cardId)` - Get option names
- `useOptionTotalStake(cardId, option)` - Total stake on option

### Platform Hooks
- `usePlatformFee()` - Get current platform fee %
- `useAccumulatedFees()` - Total collected fees

## 🎨 Display Helpers

### Formatting
- `formatTAO(amount, decimals?)` - Format TAO amounts (handles K/M suffixes)
- `formatPercentage(value, decimals?)` - Format percentages
- `formatTimeRemaining(seconds)` - Human-readable time
- `formatDeadline(timestamp)` - Format deadline date

### Calculations
- `calculatePayout(yesShares, noShares, card)` - Calculate win amounts
- `getCardStatus(card)` - Get status badge info
- `filterCards(cards, filter)` - Filter by status
- `sortCards(cards, sortBy)` - Sort cards

## 🚦 Current Status

### ✅ Working
- ✅ Blockchain card fetching
- ✅ Real-time subnet price updates
- ✅ Data enrichment and combination
- ✅ Auto-refresh on new blocks
- ✅ User share tracking
- ✅ Multi-option market support

### 🔄 Auto-Updates
- **Blockchain data**: Auto-refreshes via `watch: true` in hooks
- **Subnet prices**: Refreshes every 30 seconds from backend
- **New cards**: Appear automatically when created

### 📊 Performance
- **Initial load**: ~2-3 seconds (fetches all cards)
- **Updates**: Real-time (event-based)
- **Caching**: 30-second TTL on backend

## 🐛 Troubleshooting

### No Cards Showing

**Problem**: `displayCards.length === 0`

**Solutions**:
1. Check if contract is deployed:
   ```bash
   grep NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS .env.local
   ```

2. Verify network connection (should be Bittensor Testnet/Mainnet)

3. Check if any cards exist on-chain:
   ```typescript
   const { count } = useCardCount()
   console.log('Total cards:', count)
   ```

### Prices Not Updating

**Problem**: `currentAlphaPrice` is `null`

**Solutions**:
1. Check backend is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check subnet summaries:
   ```typescript
   const { summaries } = useSubnetSummaries()
   console.log('Summaries:', summaries)
   ```

3. Verify backend can connect to Bittensor:
   ```bash
   cd backend
   python -c "import bittensor as bt; print(bt.subtensor(network='finney').all_subnets())"
   ```

### Cards Loading Slowly

**Problem**: `isLoading` takes too long

**Solution**: Cards are fetched sequentially. With many cards, this can take time.

**Optimization** (future): Batch read multiple cards in single RPC call.

## 🎯 Next Steps

### Recommended Enhancements

1. **Card Resolution Oracle**
   - Automate card resolution using Chainlink or custom oracle
   - Fetch alpha prices on-chain at resolution time

2. **Price History**
   - Store historical alpha prices in database
   - Display price charts on card pages

3. **Notifications**
   - Alert users when cards are about to expire
   - Notify winners when cards resolve

4. **Search & Filters**
   - Search cards by subnet name
   - Filter by price range, volume, etc.

5. **Analytics**
   - Track win/loss ratios
   - Display user statistics
   - Leaderboards

## 📚 Resources

- **Contract Hooks**: `lib/contract-hooks.ts`
- **Card Helpers**: `lib/card-helpers.ts`
- **Backend Client**: `backend/app/services/bittensor_client.py`
- **Subnet Provider**: `components/SubnetProvider.tsx`
- **Main Page**: `app/page.tsx`

---

**Status**: ✅ Real data integration complete!
**Last Updated**: November 11, 2025

All mock data has been removed. The application now fetches real betting cards from the blockchain and combines them with live Bittensor subnet data. 🚀

