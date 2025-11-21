# BigInt Serialization Fix

## Problem

JavaScript's native `JSON.stringify()` cannot serialize `BigInt` values, which caused runtime errors when trying to save blockchain transaction data to Supabase:

```
TypeError: Do not know how to serialize a BigInt
  at JSON.stringify (<anonymous>)
  at PostgrestFilterBuilder.then (...)
```

## Root Cause

Blockchain transaction data from `wagmi` hooks (like `useWaitForTransaction`) returns objects that may contain `BigInt` values. When these objects were passed directly to Supabase (which uses JSON serialization internally), it caused serialization errors.

**Affected code:**
- `components/TradingPanel.tsx` - `txData.hash` passed to `addBetHistory()`
- `components/BettingModal.tsx` - Same issue
- `components/MultiOptionBettingModal.tsx` - Same issue

## Solution

### 1. Explicit String Conversion

Convert transaction hashes to strings before passing to Supabase functions:

```typescript
// Before (Error)
addBetHistory(cardId, address, outcome, amount, txData.hash)

// After (Fixed)
const txHashString = String(txData.hash)
addBetHistory(cardId, address, outcome, amount, txHashString)
```

### 2. Safe Stringify Utility

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

## Files Modified

1. **components/TradingPanel.tsx**
   - Added `const txHashString = String(txData.hash)` before Supabase calls
   - Updated both `addBetHistory()` and `recordVolumeSnapshot()` calls

2. **components/BettingModal.tsx**
   - Same fix applied

3. **components/MultiOptionBettingModal.tsx**
   - Same fix applied

4. **lib/supabase.ts**
   - Added `safeStringify()` utility function for general use

## Prevention

To prevent similar issues in the future:

1. **Always convert blockchain data to strings** before passing to Supabase or any JSON-based API
2. **Use the `safeStringify()` helper** when dealing with complex objects that might contain BigInt
3. **TypeScript types already expect strings** for transaction hashes (`txHash: string`)

## Testing

Build passes successfully after fix:
```bash
npm run build
# ✓ Compiled successfully
```

The error should no longer appear in browser console when placing bets.

