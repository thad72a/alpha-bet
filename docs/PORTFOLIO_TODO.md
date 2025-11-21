# Portfolio Page - TODO for Full Implementation

## Current Status

The portfolio page structure is in place but needs actual user share data integration.

## Issue

The `EnrichedBettingCard` type doesn't include `userShares` because:
1. User shares need to be fetched per-card using `useUserShares(address, cardId)` hook
2. Can't call hooks dynamically in a loop (React rules)
3. Need a different approach to aggregate user positions

## Solutions

### Option 1: Create a PortfolioCard Component with Hook (Recommended)

Create a component that uses the `useUserShares` hook for each card:

```typescript
// components/PortfolioCard.tsx
function PortfolioCard({ card, userAddress }) {
  const { shares } = useUserShares(userAddress, card.id)
  
  // Only render if user has shares
  if (!shares || (shares.yesShares === 0n && shares.noShares === 0n)) {
    return null
  }
  
  // Render card with actual share data
  return <Card>...</Card>
}

// Then in portfolio page:
{enrichedCards.map(card => (
  <PortfolioCard key={card.id} card={card} userAddress={address} />
))}
```

### Option 2: Batch Fetch User Shares

Create a hook that fetches user shares for multiple cards at once:

```typescript
// lib/contract-hooks.ts
export function useUserSharesBatch(userAddress: string, cardIds: number[]) {
  const contracts = cardIds.map(id => ({
    address: BETTING_CONTRACT_ADDRESS,
    abi: BETTING_ABI,
    functionName: 'getUserShares',
    args: [userAddress, BigInt(id)]
  }))
  
  const { data } = useContractReads({ contracts })
  
  return data // array of shares
}
```

### Option 3: Use Subgraph/Indexer

Index all user positions off-chain for fast querying:
- Listen to SharesPurchased events
- Store in database with user address
- Query all positions for a user instantly

## Quick Fix for Now

The portfolio page currently:
- ✅ Shows all markets (user can browse)
- ✅ Links to market detail pages
- ✅ Has proper structure and UI
- ❌ Doesn't filter by user positions
- ❌ Doesn't show accurate portfolio stats

**For MVP:** Users can still:
1. Use "Your Position" badge on market cards (home page)
2. See "Your Position" box on individual market detail pages
3. Navigate from portfolio to markets they're interested in

## Implementation Steps

1. Create `PortfolioCard` component
2. Add `useUserShares` hook per card
3. Filter out cards with no shares
4. Calculate portfolio stats from actual share data
5. Add loading states while fetching shares
6. Add caching to avoid excessive RPC calls

## Files to Modify

- [ ] `components/PortfolioCard.tsx` - New component
- [ ] `app/portfolio/page.tsx` - Use PortfolioCard component
- [ ] `lib/contract-hooks.ts` - Optional: Add batch fetch hook

## Estimated Time

- Quick fix with PortfolioCard: 30 minutes
- With proper optimization/caching: 1-2 hours
- With subgraph indexing: 4-6 hours

## Priority

**Medium** - Portfolio page works for navigation, full stats can come in next iteration

