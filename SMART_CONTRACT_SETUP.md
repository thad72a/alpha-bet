# Smart Contract Setup Guide

## Project Summary

This project includes Solidity smart contracts for a betting/prediction market on Bittensor subnet Alpha prices. The setup uses:
- **Hardhat** for compilation and deployment
- **OpenZeppelin** v4.9.6 for secure contract standards
- **Ethers.js** v6 for blockchain interaction
- **Chai** for testing

## ✅ Completed Setup

### 1. Fixed Environment Issues
- Resolved corrupted `/home/unicorn/utils/package.json` that was blocking compilation
- Moved `BettingCard.sol` to correct location (`contracts/contracts/`)

### 2. Updated Tests for Ethers v6
All tests have been migrated from Ethers v5 to v6 syntax:
- `contract.deployed()` → `await contract.waitForDeployment()`
- `contract.address` → `await contract.getAddress()`
- `ethers.utils.parseEther()` → `ethers.parseEther()`
- `bigNumber.add()` → `bigNumber + otherBigNumber`
- Fixed timestamp handling to use blockchain time instead of system time

### 3. Test Results
✅ **All 6 tests passing:**
- Card Creation (2 tests)
- Share Purchasing (2 tests)
- Card Resolution (2 tests)

### 4. Deployed Contracts

**Local Hardhat Network (localhost:8545)**
- **MockTAO Token:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **BettingCard Contract:** `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Chain ID:** 1337

## Smart Contracts Overview

### BettingCard.sol
Main prediction market contract featuring:
- Create betting cards for Alpha price predictions
- Purchase YES/NO shares using TAO tokens
- Resolve cards based on actual outcomes
- Redeem winnings
- Platform fee management
- Security: ReentrancyGuard, Ownable

### MockTAO.sol
ERC20 test token simulating TAO:
- Faucet function for easy testing
- Minting capabilities for testing scenarios

## Usage Instructions

### Running Tests
```bash
cd /home/unicorn/alpha-bet/contracts
npx hardhat test
```

### Starting Local Node
```bash
cd /home/unicorn/alpha-bet/contracts
npx hardhat node
```
*Note: Node is currently running in the background*

### Deploying Contracts
```bash
cd /home/unicorn/alpha-bet/contracts
npm run deploy:localhost
```

### Recompiling Contracts
```bash
cd /home/unicorn/alpha-bet/contracts
npx hardhat compile
```

## Frontend Integration

### Environment Variables
Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_TAO_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

### Test Accounts
Hardhat provides 20 pre-funded accounts. Use these for testing:
- Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (10,000 ETH)
- Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (10,000 ETH)
- ... (see Hardhat node output for full list)

### Getting Test TAO Tokens
Use the MockTAO faucet function:
```javascript
// In your frontend or Hardhat console
const mockTAO = await ethers.getContractAt("MockTAO", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
await mockTAO.faucet(); // Mints 1000 TAO to caller
```

## Project Structure

```
/home/unicorn/alpha-bet/
├── contracts/
│   ├── contracts/
│   │   ├── BettingCard.sol       # Main betting contract
│   │   └── MockTAO.sol           # Test ERC20 token
│   ├── test/
│   │   └── BettingCard.test.js   # Comprehensive test suite
│   ├── scripts/
│   │   └── deploy.js             # Deployment script
│   ├── hardhat.config.js         # Hardhat configuration
│   ├── package.json              # Contract dependencies
│   └── deployment-addresses.json # Latest deployment info
├── app/                          # Next.js frontend
├── components/                   # React components
└── package.json                  # Frontend dependencies
```

## Next Steps

1. **Start Frontend Development Server:**
   ```bash
   cd /home/unicorn/alpha-bet
   npm run dev
   ```

2. **Connect MetaMask to Local Network:**
   - Network Name: Localhost
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

3. **Import Test Account:**
   - Use one of Hardhat's private keys for testing
   - Get TAO tokens using the faucet function

4. **Test the Full Flow:**
   - Connect wallet to dApp
   - Get test TAO tokens
   - Create a betting card
   - Purchase shares
   - Test resolution (as contract owner)
   - Redeem winnings

## Troubleshooting

### Contract Not Found
If you get "Artifact not found" errors:
```bash
cd /home/unicorn/alpha-bet/contracts
rm -rf artifacts cache
npx hardhat compile
```

### Node Connection Issues
Restart the Hardhat node:
```bash
# Stop current node (Ctrl+C if in foreground)
npx hardhat node
```

### Test Failures
Ensure you're using blockchain time, not system time for timestamps.

## Available npm Scripts

In `/home/unicorn/alpha-bet/contracts/`:
- `npm run compile` - Compile contracts
- `npm run test` - Run test suite
- `npm run node` - Start local Hardhat node
- `npm run deploy` - Deploy to configured network
- `npm run deploy:localhost` - Deploy to local node

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Status:** ✅ Fully operational and ready for testing
**Last Updated:** October 20, 2025

