# UI Fixes Implementation Plan

## ✅ COMPLETED

### 1. Subnet Filter Bar
- ✅ Removed horizontal scroll
- ✅ Shows first 3 subnets inline
- ✅ Rest in "More" dropdown with tile menu  
- ✅ Only one category (Trending/Breaking/New) selected at a time
- ✅ Added `categoryFilter` state management

---

## 🚧 IN PROGRESS / TO BE COMPLETED

### 2. YES/NO Button Event Propagation
**File**: `components/BettingCard.tsx`
**Fix**: Add `e.stopPropagation()` to YES/NO buttons to prevent card click

### 3. Bookmark Functionality
**Files**: 
- `app/page.tsx` - Store bookmarks in localStorage
- `app/market/[id]/page.tsx` - Bookmark button
**Features**:
- Click bookmark to save/unsave
- Bookmarked cards shown first on home page
- Persist across sessions

### 4. Fix Labels & Currency
**Changes**:
- "0 traders" → "X betters" (count unique addresses with shares)
- "Volume" → "Total TAO Betted"
- "$0" under YES/NO → "X TAO"

### 5. Chart Improvements  
**File**: `components/MarketChart.tsx`
**Changes**:
- Default view: 24H (not ALL)
- Y-axis values: Divide by 1000 (show as "1K" instead of "1000")

### 6. Order Book Replacement
**File**: `app/market/[id]/page.tsx` 
**Change**: Replace order book with "Bets List"
**Show**:
- Address (truncated)
- YES/NO side
- Amount (TAO)
- Timestamp

### 7. Market Context Collapsible
**File**: `app/market/[id]/page.tsx`
**Change**: Hidden by default, click to expand

### 8. Comments Section
**File**: Component with comments
**Changes**:
- "Top Holders" → "Top Betters"
- Make Newest/Top Betters sorting functional

### 9. Profit Calculation Fix
**File**: TradingPanel or betting modal
**Issue**: Profit not divided by proper decimals
**Fix**: Use proper decimal conversion (formatEther)

### 10. Percentage Tracking
**File**: `app/market/[id]/page.tsx` or BettingCard
**Feature**: Show % change based on new bets
- Track betting volume change
- Show up/down arrows with %
- Update in real-time

---

## 📝 Implementation Details

### Bookmarks (Local Storage)
```typescript
// Store bookmarks
const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())

// Load from localStorage
useEffect(() => {
  const saved = localStorage.getItem('bookmarked_cards')
  if (saved) setBookmarks(new Set(JSON.parse(saved)))
}, [])

// Save to localStorage
const toggleBookmark = (cardId: number) => {
  const newBookmarks = new Set(bookmarks)
  if (newBookmarks.has(cardId)) {
    newBookmarks.delete(cardId)
  } else {
    newBookmarks.add(cardId)
  }
  setBookmarks(newBookmarks)
  localStorage.setItem('bookmarked_cards', JSON.stringify(Array.from(newBookmarks)))
}

// Sort cards: bookmarked first
const sortedCards = [...cards].sort((a, b) => {
  if (bookmarks.has(a.id) && !bookmarks.has(b.id)) return -1
  if (!bookmarks.has(a.id) && bookmarks.has(b.id)) return 1
  return 0
})
```

### Count Betters
```typescript
// In contract or helper
const countBetters = (cardId: number) => {
  // Query unique addresses with shares > 0
  // For binary: check userShares mapping
  // For multi: check userOptionStakes mapping
}
```

### Percentage Calculation
```typescript
const calculatePercentageChange = (card) => {
  const total = card.totalYesShares + card.totalNoShares
  if (total === 0) return { yes: 50, no: 50 }
  
  const yesPercent = (card.totalYesShares / total) * 100
  const noPercent = (card.totalNoShares / total) * 100
  
  return { yes: yesPercent, no: noPercent }
}
```

---

## 🎯 Priority Order

1. **HIGH**: Event propagation fix (blocks betting)
2. **HIGH**: Profit calculation (shows wrong numbers)  
3. **MEDIUM**: Bookmarks (nice UX feature)
4. **MEDIUM**: Labels/currency (clarity)
5. **MEDIUM**: Chart defaults
6. **LOW**: Order book replacement
7. **LOW**: Market context collapsible
8. **LOW**: Percentage tracking

---

## 🔧 Quick Fixes

### Stop YES/NO Propagation
```tsx
// In BettingCard.tsx
<Button onClick={(e) => {
  e.stopPropagation()
  handleBetClick('yes')
}}>
  YES
</Button>
```

### Chart Default to 24H
```tsx
// In MarketChart.tsx
const [timeframe, setTimeframe] = useState('24h') // was 'all'
```

### Fix Profit
```tsx
// Use formatEther properly
import { formatEther } from 'viem'

const profit = formatEther(calculatedProfitWei)
```

---

Ready to implement? Start with HIGH priority items first!

