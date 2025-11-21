# Profit Calculation Fix

## Problem

The profit/payout calculation in the "Your Position" component was showing **negative profits** or incorrect values because it was using **percentages instead of actual TAO amounts** in the calculation formula.

### Example Scenario (from user report)

**Initial state:**
- YES bets: 2 TAO
- NO bets: 1 TAO
- Total pool: 3 TAO

**User bets 4 TAO on NO:**
- YES bets: 2 TAO (unchanged)
- NO bets: 5 TAO (1 + 4)
- Total pool: 7 TAO

**If resolved as NO:**
- All NO bettors split the entire 7 TAO pool proportionally
- User has 4/5 (80%) of NO shares
- User's payout: 7 TAO × 0.8 = **5.6 TAO**
- User's profit: 5.6 - 4 = **1.6 TAO** ✓

**But the UI was showing negative profit!** ❌

## Root Cause

In `app/market/[id]/page.tsx`, the market object was incorrectly structured:

```typescript
// BEFORE (BUG)
const yesPercentage = totalShares > 0 ? (totalYes / totalShares) * 100 : 50
const noPercentage = 100 - yesPercentage

return {
  // ...
  totalYesShares: yesPercentage,  // ❌ Percentage (0-100)
  totalNoShares: noPercentage,    // ❌ Percentage (0-100)
  liquidity: totalLiquidity,      // ✓ Actual TAO amount
}
```

Then in `YourPosition.tsx`, the calculation used these values:

```typescript
// BROKEN CALCULATION
const totalYesShares = Number(market.totalYesShares) || 0  // e.g., 40 (percent)
const totalNoShares = Number(market.totalNoShares) || 0    // e.g., 60 (percent)
const totalPool = market.liquidity || 0                     // e.g., 7 TAO

// User has 4 TAO in NO
const noShares = 4

// WRONG: dividing TAO by percentage!
const noPayout = (noShares / totalNoShares) * totalPool
              = (4 / 60) * 7
              = 0.467 TAO  // ❌ Way too low!

const potentialProfit = 0.467 - 4 = -3.53 TAO  // ❌ Shows negative!
```

## Solution

Pass **actual TAO amounts** in the market object, not percentages:

```typescript
// AFTER (FIXED)
const totalYes = Number(formatEther(card.totalYesShares))    // TAO amount
const totalNo = Number(formatEther(card.totalNoShares))      // TAO amount
const yesPercentage = totalShares > 0 ? (totalYes / totalShares) * 100 : 50
const noPercentage = 100 - yesPercentage

return {
  // ...
  totalYesShares: totalYes,         // ✓ Actual TAO amount
  totalNoShares: totalNo,           // ✓ Actual TAO amount
  yesPercentage: yesPercentage,     // ✓ Percentage for display
  noPercentage: noPercentage,       // ✓ Percentage for display
  liquidity: totalLiquidity,        // ✓ Actual TAO amount
}
```

Now the calculation works correctly:

```typescript
// CORRECT CALCULATION
const totalNoShares = 5    // 5 TAO (not 60%)
const noShares = 4         // User's 4 TAO
const totalPool = 7        // Total pool

const noPayout = (noShares / totalNoShares) * totalPool
              = (4 / 5) * 7
              = 5.6 TAO  // ✓ Correct!

const potentialProfit = 5.6 - 4 = 1.6 TAO  // ✓ Correct!
```

## Files Modified

1. **`app/market/[id]/page.tsx`**
   - Changed `totalYesShares` from percentage to actual TAO amount
   - Changed `totalNoShares` from percentage to actual TAO amount
   - Added `yesPercentage` field for display purposes
   - Added `noPercentage` field for display purposes

2. **`components/TradingPanel.tsx`**
   - Updated to use `market.yesPercentage` and `market.noPercentage` for probability display
   - (Previously was using `totalYesShares`/`totalNoShares` which were percentages)

3. **`components/YourPosition.tsx`**
   - No changes needed - calculation was already correct
   - Now receives actual TAO amounts instead of percentages, so calculation works!

## Testing

**Test case from user:**
- Initial: YES = 2 TAO, NO = 1 TAO
- User bets 4 TAO on NO
- After: YES = 2 TAO, NO = 5 TAO, Total = 7 TAO

**Expected result if NO wins:**
- User's NO share: 4/5 = 80%
- User's payout: 7 × 0.8 = 5.6 TAO
- User's profit: 5.6 - 4 = **1.6 TAO** ✓

The "Your Position" box should now show:
- Total Invested: 4.0000 TAO
- Max Potential Payout: 5.6000 TAO
- Potential Profit: **+1.6000 TAO** (in green) ✓

## Build Status

```bash
npm run build
# ✓ Compiled successfully
```

## Impact

This fix ensures:
- ✅ Profit calculations are mathematically correct
- ✅ Users see accurate potential payouts
- ✅ No more confusing negative profits on winning positions
- ✅ Percentages still display correctly in UI (using separate fields)

