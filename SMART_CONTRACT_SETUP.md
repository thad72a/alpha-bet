# Smart Contract Setup Guide

## Project Summary

Alpha Bet uses Solidity smart contracts deployed on **Bittensor EVM** for a prediction market on Bittensor subnet Alpha prices. The contracts use **native TAO** tokens (no wrapping required).

**Technology Stack:**
- **Hardhat** for compilation, testing, and deployment
- **OpenZeppelin** v4.9.3 for secure contract standards
- **Ethers.js** v6 for blockchain interaction
- **Chai** for testing
- **Bittensor EVM** for deployment (Testnet Chain ID: 945, Mainnet Chain ID: 966)

## ✅ Current Status

### Smart Contracts

#### BettingCard.sol
Main prediction market contract featuring:
- **Native TAO payments** using Solidity `payable` functions
- Create betting cards for Alpha price predictions (Binary YES/NO or Multi-option)
- Purchase shares using native TAO
- Resolve cards based on actual outcomes
- Redeem winnings in native TAO
- Platform fee management (2.5% default)
- Security: ReentrancyGuard, Ownable

**Key Functions:**
- `createCard()` - Create binary YES/NO market
- `createCardMulti()` - Create multi-option market
- `purchaseShares()` - Buy YES/NO shares with native TAO
- `placeBetOnOption()` - Bet on specific option in multi-market
- `resolveCard()` - Resolve binary market (owner only)
- `resolveCardMulti()` - Resolve multi-option market (owner only)
- `redeemShares()` - Claim winnings from binary market
- `redeemOptionWinnings()` - Claim winnings from multi-option market

### Network Configuration

The project is configured for three networks:

1. **Bittensor Testnet** (Primary)
   - Chain ID: 945
   - RPC: https://test.chain.opentensor.ai
   - Currency: tTAO (Test TAO)
   - Explorer: https://evm.taostats.io

2. **Bittensor Mainnet**
   - Chain ID: 966
   - RPC: https://lite.chain.opentensor.ai
   - Currency: TAO
   - Explorer: https://evm.taostats.io

3. **Localhost** (Development)
   - Chain ID: 1337
   - RPC: http://127.0.0.1:8545
   - For local Hardhat testing

## Installation & Setup

### 1. Install Dependencies

```bash
cd /home/unicorn/alpha-bet/contracts
npm install
```

### 2. Set Up Environment Variables

Create or update `.env.local` in the project root:

```env
# Deployment Private Key (KEEP SECRET!)
PRIVATE_KEY=your_private_key_here

# Network Configuration
NEXT_PUBLIC_NETWORK=bittensorTestnet
NEXT_PUBLIC_CHAIN_ID=945
NEXT_PUBLIC_RPC_URL=https://test.chain.opentensor.ai

# Contract Addresses (filled in after deployment)
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=0x...

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Compile Contracts

```bash
cd contracts
npm run compile
```

This generates artifacts in `contracts/artifacts/` directory.

## Deployment

### Deploy to Bittensor Testnet

1. **Get Test TAO**
   - Visit [Bittensor Testnet Faucet](https://faucet.bittensor.com/)
   - Request testnet TAO for your address
   - Wait for confirmation

2. **Add Private Key to `.env.local`**
   ```env
   PRIVATE_KEY=0x1234567890abcdef... # Your private key
   ```

3. **Deploy**
   ```bash
   cd contracts
   npm run deploy:testnet
   ```

4. **Verify Deployment**
   - Check the console output for contract address
   - Visit https://evm.taostats.io/address/YOUR_CONTRACT_ADDRESS
   - The script automatically updates `.env.local` with the deployed address

5. **Restart Frontend**
   ```bash
   npm run dev
   ```

### Deploy to Bittensor Mainnet

⚠️ **WARNING**: Mainnet deployment uses real TAO!

```bash
cd contracts
npm run deploy:mainnet
```

Make sure:
- You have real TAO for gas fees
- Your private key is secure
- You've tested thoroughly on testnet first

### Local Development Deployment

For local testing with Hardhat:

```bash
# Terminal 1: Start Hardhat node
cd contracts
npm run node

# Terminal 2: Deploy
npm run deploy:localhost
```

## Testing

### Run All Tests

```bash
cd contracts
npm run test
```

### Test Structure

The test suite (`test/BettingCard.test.js`) covers:

1. **Card Creation**
   - Creating binary (YES/NO) markets
   - Creating multi-option markets
   - Validation checks

2. **Share Purchasing**
   - Buying shares with native TAO
   - Platform fee calculation
   - Liquidity tracking

3. **Card Resolution**
   - Resolving binary markets
   - Resolving multi-option markets
   - Owner-only restrictions

4. **Redemption**
   - Claiming winnings
   - Payout calculations
   - Preventing double-claims

### Test Coverage

All tests use native TAO (via `{ value: amount }` in transactions).

## Contract Addresses

Current deployments are tracked in `contracts/deployment-addresses.json`.

**Format:**
```json
{
  "bittensorTestnet": {
    "network": "bittensorTestnet",
    "chainId": 945,
    "contracts": {
      "BettingCard": "0x...",
      "TAO": "native"
    },
    "deployedAt": "2025-11-11T..."
  }
}
```

## Usage Examples

### Creating a Binary Market

```javascript
const netuid = 1; // Subnet ID
const targetPrice = ethers.parseEther("0.025"); // 0.025 TAO
const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

const tx = await bettingCard.createCard(netuid, targetPrice, deadline);
await tx.wait();
```

### Purchasing Shares

```javascript
const cardId = 1;
const yesShares = ethers.parseEther("10"); // 10 TAO worth of YES
const noShares = ethers.parseEther("5");   // 5 TAO worth of NO
const totalCost = yesShares + noShares;    // 15 TAO total

const tx = await bettingCard.purchaseShares(
  cardId, 
  yesShares, 
  noShares,
  { value: totalCost } // Send native TAO
);
await tx.wait();
```

### Creating a Multi-Option Market

```javascript
const netuid = 1;
const options = ["Option A", "Option B", "Option C"];
const deadline = Math.floor(Date.now() / 1000) + 86400;

const tx = await bettingCard.createCardMulti(netuid, options, deadline);
await tx.wait();
```

### Placing a Bet on Option

```javascript
const cardId = 1;
const optionIndex = 0; // Bet on Option A
const betAmount = ethers.parseEther("10"); // 10 TAO

const tx = await bettingCard.placeBetOnOption(
  cardId,
  optionIndex,
  { value: betAmount }
);
await tx.wait();
```

## Frontend Integration

### Using the Contract in React/Next.js

The frontend uses Wagmi v1 for contract interaction. Example:

```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { BETTING_ABI } from '@/lib/abis';
import { BETTING_CONTRACT_ADDRESS } from '@/lib/contracts';

// Prepare the transaction
const { config } = usePrepareContractWrite({
  address: BETTING_CONTRACT_ADDRESS,
  abi: BETTING_ABI,
  functionName: 'purchaseShares',
  args: [cardId, yesShares, noShares],
  value: totalCost, // Native TAO amount
});

// Execute the transaction
const { write } = useContractWrite(config);
```

## Address Format Support

Bittensor supports two address formats:

### SS58 (Substrate/Polkadot)
- Format: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- Used for native Bittensor chain operations
- Requires Polkadot.js wallet

### H160 (EVM/Ethereum)
- Format: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- Used for smart contract interactions
- Requires MetaMask or EVM-compatible wallet

**For this dApp**: Users must have an **H160 address** to interact with the BettingCard contract.

See `lib/bittensor-wallet.ts` for utility functions to detect and validate address formats.

## Gas Fees

All transactions on Bittensor EVM require gas fees paid in TAO:

- **createCard**: ~100,000 gas
- **createCardMulti**: ~150,000+ gas (depends on option count)
- **purchaseShares**: ~80,000 gas
- **placeBetOnOption**: ~70,000 gas
- **resolveCard**: ~50,000 gas
- **redeemShares**: ~40,000 gas

Actual gas costs vary based on network congestion and transaction complexity.

## Security Considerations

1. **Private Key Security**
   - Never commit `.env.local` to git
   - Use hardware wallets for mainnet deployments
   - Rotate keys regularly

2. **Smart Contract Security**
   - ReentrancyGuard prevents reentrancy attacks
   - Ownable restricts resolution to contract owner
   - Platform fees capped at 10% maximum
   - No token approval needed (native TAO)

3. **Testing**
   - Always test on testnet first
   - Verify all transactions on explorer
   - Test with small amounts initially

## Troubleshooting

### "Insufficient funds" Error
- Ensure you have enough TAO for both the transaction amount and gas fees
- Check your balance: `await provider.getBalance(yourAddress)`

### "Transaction reverted" Error
- Check that the betting period hasn't ended
- Verify you're sending the correct amount with `{ value: amount }`
- Ensure the card hasn't been resolved yet

### Contract Not Found
- Verify the contract address in `.env.local`
- Check that you're on the correct network (testnet vs mainnet)
- Recompile contracts: `npm run compile`

### Tests Failing
- Clear cache: `rm -rf artifacts cache`
- Recompile: `npm run compile`
- Check that you're using the correct Ethers.js v6 syntax

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Bittensor Documentation](https://docs.bittensor.com/)
- [Bittensor EVM Explorer](https://evm.taostats.io)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Wagmi Documentation](https://wagmi.sh/)

---

**Status:** ✅ Fully operational with native TAO on Bittensor EVM
**Last Updated:** November 11, 2025
