# BigInt Serialization & Hydration Fixes

## Problem 1: BigInt Serialization

JavaScript's native `JSON.stringify()` cannot serialize `BigInt` values, which caused runtime errors when trying to save blockchain transaction data to Supabase:

```
TypeError: Do not know how to serialize a BigInt
  at JSON.stringify (<anonymous>)
  at PostgrestFilterBuilder.then (...)
```

## Problem 2: React Hydration Errors

React minified errors #418 and #423 were occurring due to server/client mismatch when using `Date.now()` during render, causing:

```
Uncaught Error: Minified React error #418
Uncaught Error: Minified React error #423
```

## Root Cause

Blockchain transaction data from `wagmi` hooks (like `useWaitForTransaction`) returns objects that may contain `BigInt` values. When these objects were passed directly to Supabase (which uses JSON serialization internally), it caused serialization errors.

**Affected code:**
- `components/TradingPanel.tsx` - `txData.hash` passed to `addBetHistory()`
- `components/BettingModal.tsx` - Same issue
- `components/MultiOptionBettingModal.tsx` - Same issue

## Solutions

### BigInt Serialization Fix

#### 1. Explicit String Conversion in Components

Convert transaction hashes to strings before passing to Supabase functions:

```typescript
// Before (Error)
addBetHistory(cardId, address, outcome, amount, txData.hash)

// After (Fixed)
const txHashString = String(txData.hash)
addBetHistory(cardId, address, outcome, amount, txHashString)
```

#### 2. Safe Data Sanitization in Supabase Functions

Added type conversion directly in Supabase functions to handle ALL potential BigInt values:

```typescript
// In addBetHistory()
const safeData = {
  card_id: Number(cardId),
  user_address: String(userAddress),
  bet_type: betType,
  option_index: optionIndex !== undefined ? Number(optionIndex) : null,
  amount: String(amount),
  tx_hash: String(txHash),
  timestamp: new Date().toISOString()
}

await supabase.from('user_bet_history').insert(safeData)
```

#### 3. Safe Stringify Utility

Added a `safeStringify()` helper function in `lib/supabase.ts` for future-proofing:

```typescript
export function safeStringify(value: any): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value, (key, val) => 
      typeof val === 'bigint' ? val.toString() : val
    )
  }
  return String(value)
}
```

### Hydration Fix

Fixed server/client rendering mismatch in `BettingCard.tsx`:

```typescript
// Before (Hydration Error)
const isExpired = Date.now() / 1000 > card.timestamp

// After (Fixed)
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
}, [])

// Only calculate time-based values on client
const isExpired = isMounted ? Date.now() / 1000 > card.timestamp : false
```

## Files Modified

1. **components/TradingPanel.tsx**
   - Added `const txHashString = String(txData.hash)` before Supabase calls
   - Updated both `addBetHistory()` and `recordVolumeSnapshot()` calls

2. **components/BettingModal.tsx**
   - Same BigInt fix applied

3. **components/MultiOptionBettingModal.tsx**
   - Same BigInt fix applied

4. **lib/supabase.ts**
   - Added `safeStringify()` utility function
   - **CRITICAL**: Added type conversion in `addBetHistory()`, `recordVolumeSnapshot()`, and `addComment()`
   - All numeric values converted with `Number()`
   - All string values converted with `String()`
   - Handles `optionIndex` and `parentId` nullable fields

5. **components/BettingCard.tsx**
   - Added `isMounted` state to prevent hydration mismatch
   - Guarded `Date.now()` calculations with `isMounted` check

## Prevention

To prevent similar issues in the future:

1. **Always convert blockchain data to strings** before passing to Supabase or any JSON-based API
2. **Use the `safeStringify()` helper** when dealing with complex objects that might contain BigInt
3. **TypeScript types already expect strings** for transaction hashes (`txHash: string`)

## Testing

Build passes successfully after all fixes:
```bash
npm run build
# ✓ Compiled successfully
```

Expected results:
- ✅ No more BigInt serialization errors when placing bets
- ✅ No more React hydration errors (#418, #423)
- ✅ Supabase bet history saves correctly
- ✅ Cards render properly without server/client mismatch

## Summary

The complete fix required:
1. **Converting all transaction hashes** from potential BigInt to string in components
2. **Sanitizing ALL data** at the Supabase function level with explicit type conversions
3. **Guarding time-based calculations** with `isMounted` checks to prevent hydration mismatches

This two-layer approach (component-level + Supabase-level) ensures no BigInt values can slip through, even if new code is added later.

