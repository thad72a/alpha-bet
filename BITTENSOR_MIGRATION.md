# Bittensor Migration Guide

## Summary

Successfully migrated Alpha Bet from mockTAO to **native Bittensor TAO** integration with full support for Bittensor EVM.

## What Changed

### ✅ Removed MockTAO
- **Deleted**: MockTAO.sol contract (was never in contracts folder)
- **Deleted**: `contracts/scripts/send-tao.js` (mockTAO transfer script)
- **Deleted**: `contracts/scripts/deploy-and-setup.js` (old deployment script with mockTAO)
- **Deleted**: `app/admin/page.tsx` (mockTAO faucet admin page)
- **Updated**: All deployment scripts to remove mockTAO references

### ✅ Contract Updates
- **BettingCard.sol**: Already configured for native TAO (uses `payable` functions)
- No contract changes needed - it was already built for native payments!

### ✅ Deployment Scripts

**Updated Files:**
1. `contracts/scripts/deploy.js` - Generic deployment script (local/testnet/mainnet)
2. `contracts/scripts/deploy-bittensor.js` - Bittensor-specific deployment (unchanged, already correct)

**New NPM Scripts:**
```bash
npm run deploy              # Generic deploy
npm run deploy:localhost    # Deploy to local Hardhat
npm run deploy:testnet      # Deploy to Bittensor Testnet
npm run deploy:mainnet      # Deploy to Bittensor Mainnet
```

### ✅ Tests Updated

**File**: `contracts/test/BettingCard.test.js`

**Changes:**
- Removed MockTAO deployment and faucet calls
- Updated `purchaseShares()` calls to include `{ value: totalCost }`
- Added platform fee calculations to tests
- All tests now use native TAO

### ✅ Configuration Files

**Updated:**
1. `contracts/deployment-addresses.json` - Now points to Bittensor Testnet
2. `contracts/package.json` - Added new deploy scripts
3. `env.example` - Comprehensive documentation with comments
4. `contracts/hardhat.config.js` - Already had Bittensor networks (no changes needed)

### ✅ Documentation

**Completely Rewritten:**
1. `README.md` - Updated with Bittensor EVM info, address format support
2. `SMART_CONTRACT_SETUP.md` - Comprehensive guide for native TAO usage
3. This file: `BITTENSOR_MIGRATION.md` - Migration summary

### ✅ New Utilities

**Created**: `lib/bittensor-wallet.ts`

Utility functions for Bittensor address support:
- `isValidSS58Address()` - Check if address is SS58 format
- `isValidH160Address()` - Check if address is H160/EVM format
- `detectAddressType()` - Auto-detect address format
- `formatAddress()` - Format address for display
- `getAddressInfo()` - Get comprehensive address info
- `getExplorerUrl()` - Get appropriate block explorer URL
- `canInteractWithContract()` - Check if user can use smart contracts
- `getAddressTypeHelp()` - User-friendly help messages

## How to Use

### 1. Set Up Environment

```bash
# Copy example to .env.local
cp env.example .env.local

# Edit .env.local with your values
# Add your private key for deployment
```

### 2. Get Test TAO

Visit the Bittensor Testnet Faucet:
- URL: https://faucet.bittensor.com/
- Request tTAO for your address
- Wait for confirmation

### 3. Deploy to Testnet

```bash
cd contracts
npm run compile
npm run deploy:testnet
```

The script will:
- Deploy BettingCard contract
- Save deployment info to `deployment-addresses.json`
- Auto-generate `.env.local` with contract address
- Display setup instructions

### 4. Start Frontend

```bash
npm run dev
```

Open http://localhost:3000 and connect your MetaMask wallet.

### 5. Configure MetaMask

Add Bittensor Testnet to MetaMask:
- **Network Name**: Bittensor Testnet
- **RPC URL**: https://test.chain.opentensor.ai
- **Chain ID**: 945
- **Currency Symbol**: tTAO
- **Block Explorer**: https://evm.taostats.io

## Address Format Support

Bittensor supports **two address formats**:

### SS58 (Polkadot/Substrate)
- **Format**: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- **Used for**: Native Bittensor chain operations
- **Wallet**: Polkadot.js extension
- **Not compatible** with smart contracts

### H160 (EVM/Ethereum)
- **Format**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- **Used for**: Smart contract interactions on Bittensor EVM
- **Wallet**: MetaMask, WalletConnect, etc.
- **Required** for Alpha Bet dApp

**Important**: To use Alpha Bet, you must have an **H160 (EVM) address**. Use MetaMask or another EVM-compatible wallet.

## Networks

### Bittensor Testnet (Recommended for Testing)
- **Chain ID**: 945
- **RPC**: https://test.chain.opentensor.ai
- **Explorer**: https://evm.taostats.io
- **Currency**: tTAO (free from faucet)

### Bittensor Mainnet (Production)
- **Chain ID**: 966
- **RPC**: https://lite.chain.opentensor.ai
- **Explorer**: https://evm.taostats.io
- **Currency**: TAO (real value)

## Key Differences from MockTAO

### Before (MockTAO)
```javascript
// Deploy mock token
const MockTAO = await ethers.getContractFactory("MockTAO");
const mockTAO = await MockTAO.deploy();

// Approve spending
await mockTAO.approve(bettingCard.address, amount);

// Purchase shares
await bettingCard.purchaseShares(cardId, yesShares, noShares);
```

### After (Native TAO)
```javascript
// No token deployment needed!
// No approval needed!

// Purchase shares directly with native TAO
await bettingCard.purchaseShares(
  cardId, 
  yesShares, 
  noShares,
  { value: totalCost } // Send native TAO
);
```

## Benefits of Native TAO

1. **No Token Contract**: Simpler, no need to deploy or manage ERC20 token
2. **No Approvals**: Users don't need to approve token spending (better UX)
3. **Gas Efficient**: Direct transfers use less gas than ERC20 transfers
4. **Native Integration**: Works seamlessly with Bittensor's native currency
5. **Security**: Fewer contracts = smaller attack surface

## Testing

Run the test suite:

```bash
cd contracts
npm test
```

All tests have been updated to:
- Remove mockTAO deployment
- Use native TAO with `{ value: amount }`
- Test platform fee calculations
- Verify proper liquidity tracking

## Frontend Integration

The frontend already works with native TAO through Wagmi v1:

```typescript
import { useContractWrite } from 'wagmi';

const { write } = useContractWrite({
  address: BETTING_CONTRACT_ADDRESS,
  abi: BETTING_ABI,
  functionName: 'purchaseShares',
  args: [cardId, yesShares, noShares],
  value: totalCost, // Native TAO amount in wei
});
```

## Troubleshooting

### "Insufficient funds" Error
**Problem**: Not enough TAO for transaction + gas
**Solution**: 
- Check balance: Should have TAO for transaction amount + gas fees
- Get more tTAO from testnet faucet
- For mainnet: Buy TAO and transfer to your wallet

### "Transaction reverted" Error
**Problem**: Transaction validation failed
**Solution**:
- Ensure betting period hasn't ended
- Check you're sending correct amount with `{ value: amount }`
- Verify card hasn't been resolved yet

### Address Format Issues
**Problem**: Wrong wallet type (SS58 vs H160)
**Solution**:
- Use MetaMask or EVM wallet for H160 addresses
- Import utilities from `lib/bittensor-wallet.ts` to detect and handle address types

### Network Not Showing in MetaMask
**Problem**: Bittensor network not configured
**Solution**: Manually add network with details from this guide

## Next Steps

### Recommended Actions

1. **Test on Testnet**
   - Deploy contract to testnet
   - Create test markets
   - Purchase shares with testnet TAO
   - Test resolution and redemption

2. **Verify on Explorer**
   - Check contract on https://evm.taostats.io
   - Verify transactions
   - Review event logs

3. **Update Frontend**
   - Ensure wallet connection works
   - Test create card flow
   - Test purchase shares flow
   - Test redemption flow

4. **Consider Oracle Integration**
   - Currently resolution is manual (owner calls resolveCard)
   - Could integrate Chainlink or custom oracle for automation
   - Add backend service to fetch alpha prices

5. **Security Audit**
   - Before mainnet deployment, consider security audit
   - Test thoroughly with real users on testnet
   - Set up monitoring and alerting

## Support Resources

- **Bittensor Docs**: https://docs.bittensor.com/
- **Bittensor Discord**: Join for support and updates
- **EVM Explorer**: https://evm.taostats.io
- **Testnet Faucet**: https://faucet.bittensor.com/
- **Hardhat Docs**: https://hardhat.org/docs
- **Wagmi Docs**: https://wagmi.sh/

## Files Modified

### Deleted
- ❌ `contracts/scripts/send-tao.js`
- ❌ `contracts/scripts/deploy-and-setup.js`
- ❌ `app/admin/page.tsx`

### Created
- ✅ `lib/bittensor-wallet.ts`
- ✅ `BITTENSOR_MIGRATION.md` (this file)

### Updated
- ✏️ `contracts/scripts/deploy.js`
- ✏️ `contracts/test/BettingCard.test.js`
- ✏️ `contracts/package.json`
- ✏️ `contracts/deployment-addresses.json`
- ✏️ `env.example`
- ✏️ `README.md`
- ✏️ `SMART_CONTRACT_SETUP.md`

### Unchanged (Already Correct)
- ✓ `contracts/contracts/BettingCard.sol` - Already using native TAO!
- ✓ `contracts/hardhat.config.js` - Already configured for Bittensor networks
- ✓ `contracts/scripts/deploy-bittensor.js` - Already perfect for Bittensor
- ✓ `app/providers.tsx` - Already configured for Bittensor Testnet
- ✓ `lib/contracts.ts` - Already has correct exports
- ✓ `lib/abis.ts` - Already has BettingCard ABI

## Conclusion

The migration from mockTAO to native Bittensor TAO is complete! The system now:

✅ Uses native TAO (no wrapped tokens)
✅ Supports both Bittensor Testnet and Mainnet
✅ Has utilities for SS58 and H160 address formats
✅ Includes comprehensive documentation
✅ Has updated tests for native TAO
✅ Has proper deployment scripts for all networks

The project is ready for deployment to Bittensor EVM! 🚀

---

**Migration Completed**: November 11, 2025
**Bittensor EVM Ready**: Yes ✅

