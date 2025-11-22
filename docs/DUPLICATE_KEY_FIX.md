# Duplicate Key Error Fix - Bet History

## Problem

User reported error when placing bets:
```
Error adding bet history: duplicated key ...
```

## Root Cause

The `user_bet_history` table has a **UNIQUE constraint** on `tx_hash`:

```sql
CREATE TABLE user_bet_history (
  id UUID PRIMARY KEY,
  card_id INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  option_index INTEGER,
  amount TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,  -- ⚠️ UNIQUE constraint
  timestamp TIMESTAMPTZ NOT NULL
);
```

### When Duplicates Occur

1. **Double-Click**: User clicks bet button twice quickly
2. **Component Re-render**: React re-renders and triggers save again
3. **Network Retry**: Connection issues cause retry with same tx_hash
4. **Multiple Calls**: Multiple components trying to save the same transaction

### Why UNIQUE Constraint Exists

The constraint is **intentional** - each blockchain transaction should only be recorded once. The issue is that we weren't handling the duplicate gracefully.

## Solution

### Primary Key Structure

```
PRIMARY KEY: id (UUID, auto-generated)
UNIQUE CONSTRAINT: tx_hash (transaction hash from blockchain)
```

- **`id`**: Auto-generated UUID, always unique
- **`tx_hash`**: Blockchain transaction hash, must be unique (one record per transaction)

### Code Fix

Changed from simple `insert()` to `upsert()` with duplicate handling:

**Before:**
```typescript
const { error } = await supabase
  .from('user_bet_history')
  .insert(safeData)

if (error) {
  console.error('Error adding bet history:', error)
  return false
}
```

**After:**
```typescript
const { error } = await supabase
  .from('user_bet_history')
  .upsert(safeData, { 
    onConflict: 'tx_hash',
    ignoreDuplicates: true 
  })

if (error) {
  // Gracefully handle duplicates
  if (error.code === '23505') { // PostgreSQL unique violation
    console.log('ℹ️ Bet already recorded (duplicate tx_hash):', txHash)
    return true // Success - bet is already saved
  }
  console.error('Error adding bet history:', error)
  return false
}
```

### What This Does

1. **Upsert Logic**: Try to insert, but if `tx_hash` exists, ignore it
2. **Error Code Check**: PostgreSQL error code `23505` = unique constraint violation
3. **Graceful Handling**: Treat duplicate as success (data is already there)
4. **Better Logging**: Informational message instead of error

### Applied To

1. ✅ **`addBetHistory()`** - Bet history tracking
2. ✅ **`recordVolumeSnapshot()`** - Volume snapshot tracking

## Testing

### Test Case 1: Normal Bet
```
User places bet → tx_hash: 0xabc123
Result: ✅ Saved successfully
```

### Test Case 2: Double-Click
```
User double-clicks bet button
  - First call: tx_hash: 0xabc123 → ✅ Saved
  - Second call: tx_hash: 0xabc123 → ℹ️ Duplicate ignored, returns success
Result: ✅ No error, one record in database
```

### Test Case 3: Component Re-render
```
Component re-renders after bet
  - First save: tx_hash: 0xabc123 → ✅ Saved
  - Re-render save: tx_hash: 0xabc123 → ℹ️ Duplicate ignored
Result: ✅ No error, clean UI
```

## Benefits

1. **No More Errors**: Users won't see "duplicated key" errors
2. **Data Integrity**: Still ensures one transaction = one record
3. **Better UX**: Doesn't break the flow when duplicates occur
4. **Idempotent**: Can safely call multiple times with same transaction
5. **Clear Logging**: Informational messages for debugging

## Database Schema (Unchanged)

No database changes needed. The UNIQUE constraint stays:

```sql
-- This constraint is good and stays in place
tx_hash TEXT NOT NULL UNIQUE
```

The fix is purely in the application code to handle the constraint gracefully.

## Related Files

- `/lib/supabase.ts` - Modified `addBetHistory()` and `recordVolumeSnapshot()`
- `/supabase/schema.sql` - Original schema with UNIQUE constraint
- `/components/TradingPanel.tsx` - Calls `addBetHistory()`
- `/components/BettingModal.tsx` - Calls `addBetHistory()`
- `/components/MultiOptionBettingModal.tsx` - Calls `addBetHistory()`

## Summary

✅ **Problem**: Duplicate key errors when saving bet history  
✅ **Cause**: UNIQUE constraint on `tx_hash` + multiple save attempts  
✅ **Solution**: Upsert with graceful duplicate handling  
✅ **Result**: No errors, data integrity maintained, better UX


