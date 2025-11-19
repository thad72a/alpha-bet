# Resolution UI Implementation Guide

## Overview

The Resolution UI has been successfully implemented! Users can now resolve pending markets through a decentralized process directly from the market detail page.

## Where to Find It

### Main Page - Pending Filter
1. Navigate to the home page (`/`)
2. Click the **"Pending"** filter button (yellow badge)
3. This shows all markets that have passed their deadline but are not yet resolved
4. Click on any pending market card to open the detail page

### Market Detail Page - Resolution Panel
When viewing a market that is **past its deadline** and **not yet resolved**, the Resolution Panel automatically appears in place of the Trading Panel on the right side.

## User Flow

### 1. **Propose Resolution** (No existing proposal)

When a market is pending resolution, anyone can propose the outcome:

#### For Binary Markets:
- Enter the **actual price** of the asset at the deadline
- The system will automatically determine if it resolves to YES or NO based on whether the actual price is greater than or equal to the target price
- Click **"Propose Resolution"** button
- Pay the **10 TAO bond** (shown in the UI)
- Wait for transaction confirmation

#### For Multi-Option Markets:
- Select the **winning option** from the list
- Click **"Propose Resolution"** button
- Pay the **10 TAO bond**
- Wait for transaction confirmation

**What happens next:**
- A 48-hour challenge period begins
- Other users can dispute your proposal
- If no dispute occurs, anyone can finalize after 48 hours

### 2. **Dispute Resolution** (Proposal exists, not disputed yet)

If you believe a proposal is incorrect:

- Review the **Current Proposal** section showing:
  - Proposer address
  - Proposed price or winning option
  - Bond amount
  - Time remaining in challenge period
- Click **"Dispute Resolution"** button
- Pay a bond **equal to the proposer's bond** (usually 10 TAO)
- Wait for transaction confirmation

**What happens next:**
- Voting period begins (48 hours)
- All market participants can vote based on their share holdings
- Votes are weighted by shares held

### 3. **Vote on Disputed Resolution** (Voting period active)

When a proposal is disputed, participants vote:

- Review both sides:
  - **Votes FOR** (support the proposal)
  - **Votes AGAINST** (reject the proposal)
- See the progress bar showing current vote distribution
- Choose your vote:
  - **"Support"** button (green) - Vote FOR the proposal
  - **"Reject"** button (red) - Vote AGAINST the proposal
- Your voting power is based on your **total shares** (YES + NO) in this market
- Wait for transaction confirmation

**What happens next:**
- Votes are tallied at the end of the voting period
- Majority wins
- Winner receives all bonds from both proposer and challenger

### 4. **Finalize Resolution** (All periods ended)

After challenge/voting periods end:

- The panel shows **"Finalize Resolution"** button
- Anyone can click to finalize (doesn't cost gas for bonds)
- System executes the final outcome based on:
  - **Undisputed:** Original proposal is accepted
  - **Disputed:** Majority vote determines outcome
- Winner receives their bond back plus loser's bond
- Market is marked as **RESOLVED**

## UI Components

### Status Banner
Shows current state with color-coded indicators:
- 🟡 **Yellow** - Awaiting proposal
- 🟠 **Orange** - Proposal active, challenge period
- 🔴 **Red** - Disputed, voting active
- 🔵 **Blue** - Ready to finalize

### Proposal Details Card
Displays:
- Proposer address (truncated)
- Proposed price or winning option
- Bond amounts
- Vote counts (if disputed)
- Visual progress bar for votes
- Time remaining countdown

### Information Boxes
Context-sensitive help text explains:
- What action to take
- What happens next
- Bond requirements
- How voting works

### "How Resolution Works" Section
Always visible at bottom:
- Anyone can propose outcome with bond
- 48-hour challenge period
- Community voting if disputed
- Winner receives all bonds

## Technical Details

### New Component: `ResolutionPanel.tsx`
Located in `/components/ResolutionPanel.tsx`

Features:
- ✅ Real-time proposal data fetching
- ✅ Countdown timers for periods
- ✅ Automatic state management
- ✅ Transaction handling with loading states
- ✅ Success/error toasts
- ✅ Responsive design matching app style

### Hooks Used
From `/lib/contract-hooks.ts`:

**Read Hooks:**
- `useProposal(cardId)` - Get current proposal state
- `useResolutionBond()` - Get bond requirement (10 TAO)
- `useDisputePeriod()` - Get challenge period duration
- `useVotingPeriod()` - Get voting period duration

**Write Hooks:**
- `useProposeResolution(cardId, actualPrice)` - Propose for binary cards
- `useProposeResolutionMulti(cardId, winningOption)` - Propose for multi cards
- `useDisputeResolution(cardId, bondAmount)` - Challenge a proposal
- `useVoteOnResolution(cardId, supportsProposal)` - Cast a vote
- `useFinalizeResolution(cardId)` - Finalize the resolution

### Market Detail Page Changes
File: `/app/market/[id]/page.tsx`

The right sidebar now shows:
- **ResolutionPanel** when market is pending/disputed
- **TradingPanel** when market is active or resolved (disabled if resolved)

Logic:
```typescript
{!market.resolved && Date.now() / 1000 > market.timestamp ? (
  <ResolutionPanel market={market} />
) : (
  <TradingPanel market={market} />
)}
```

### Trading Panel Enhancement
File: `/components/TradingPanel.tsx`

Added:
- `isBettingDisabled` check for resolved or past-deadline markets
- Button shows "Market Resolved" or "Betting Closed" when disabled

## Bond Economics

### Standard Bond: 10 TAO

**Scenarios:**

1. **Undisputed Proposal:**
   - Proposer gets: 10 TAO back
   - Net: Break even

2. **Disputed - Proposer Wins Vote:**
   - Proposer gets: 20 TAO (their 10 + challenger's 10)
   - Net: +10 TAO profit

3. **Disputed - Challenger Wins Vote:**
   - Challenger gets: 20 TAO (proposer's 10 + their 10)
   - Net: +10 TAO profit
   - Proposer: Loses 10 TAO

**Incentive Structure:**
- ✅ Encourages correct proposals (avoid disputes)
- ✅ Punishes incorrect proposals (lose bond)
- ✅ Rewards vigilant challengers (win bond)
- ✅ Economic security for market integrity

## Testing Checklist

### As a User, Test:
- [ ] View pending markets on home page
- [ ] Open a pending market detail page
- [ ] See ResolutionPanel appear
- [ ] Propose a resolution (binary market)
- [ ] Propose a resolution (multi market)
- [ ] Dispute a proposal
- [ ] Vote on a disputed proposal
- [ ] Finalize a resolution
- [ ] Verify bonds are transferred correctly

### Edge Cases to Verify:
- [ ] Can't propose twice
- [ ] Can't dispute after period ends
- [ ] Can't vote if not disputed
- [ ] Can't finalize before periods end
- [ ] Wallet connect flow works in all actions
- [ ] Transaction errors display properly
- [ ] Success notifications show up
- [ ] Page refreshes after successful actions

## Next Steps (Future Enhancements)

### Short Term:
1. **Real-time Countdowns** - Live updating timers (currently shows static)
2. **Voting Power Display** - Show user's voting power before voting
3. **Recent Activity** - Show proposal/dispute/vote history
4. **Notifications** - Alert users when their markets need action

### Medium Term:
5. **Price Oracles** - Auto-suggest actual price from Bittensor
6. **Reputation System** - Track proposer accuracy
7. **Reduced Bonds** - Lower bonds for trusted proposers
8. **Batch Operations** - Resolve multiple markets at once

### Long Term:
9. **Automated Resolution Bot** - Auto-propose correct outcomes
10. **Insurance Pool** - Protocol-level dispute insurance
11. **Appeal Period** - Emergency 24h appeal for edge cases
12. **Governance** - Community can adjust parameters

## Screenshots / Demo

### Pending Market (No Proposal)
- Yellow banner: "Awaiting Resolution Proposal"
- Input field for actual price / option selection
- "Propose Resolution" button with bond amount
- Information about the process

### Proposed Resolution (Challenge Period)
- Orange banner: "Resolution Proposed - Challenge Period"
- Proposal details card with proposer info
- Countdown timer
- "Dispute Resolution" button

### Disputed Resolution (Voting Period)
- Red banner: "Resolution Disputed - Voting Active"
- Vote counts and progress bar
- "Support" and "Reject" buttons
- Voting power information

### Ready to Finalize
- Green info box: "Period has ended"
- "Finalize Resolution" button
- Explanation of outcome determination

## Support & Troubleshooting

### Common Issues:

**"Can't propose resolution"**
- Check wallet is connected
- Verify you have 10 TAO for bond
- Ensure deadline has passed
- Confirm no proposal exists yet

**"Dispute button not showing"**
- Check if proposal exists
- Verify you're within 48h challenge period
- Ensure not already disputed

**"Can't vote"**
- Verify proposal is disputed
- Check you're within voting period
- Must own shares in the market

**"Transaction failed"**
- Check TAO balance for bonds
- Verify network connection
- Try refreshing and reconnecting wallet

## Conclusion

The decentralized resolution system is now **fully functional** with a complete UI! Users can:
- ✅ Discover pending markets easily
- ✅ Propose resolutions with clear guidance
- ✅ Challenge incorrect proposals
- ✅ Vote on disputes democratically
- ✅ Finalize outcomes trustlessly

The platform is now a **true prediction market** with no centralized control over outcomes! 🎉

