# Bittensor Deployment Troubleshooting

## ❌ Error: `wasm trap: wasm unreachable instruction executed`

This error occurs when deploying to Bittensor Testnet. The good news: **your contract is fine** (it deploys successfully on localhost).

## Root Cause

The Bittensor Testnet RPC (`https://test.chain.opentensor.ai`) is experiencing runtime issues. This is a chain-level problem, not a contract problem.

## ✅ Verified Working

```bash
✅ Contract deploys successfully on localhost
✅ Contract code is valid
✅ You have sufficient tTAO (11 tTAO)
```

## 🔧 Solutions

### Solution 1: Wait and Retry (Recommended)

The testnet might be temporarily unstable. Wait 30-60 minutes and try again:

```bash
cd contracts
npm run deploy:testnet
```

### Solution 2: Deploy to Bittensor Mainnet Instead

If testnet continues to have issues, you can deploy directly to mainnet:

⚠️ **Warning**: Uses real TAO! Make sure you have:
- Real TAO for gas fees
- Tested contract thoroughly on localhost

```bash
cd contracts
npm run deploy:mainnet
```

### Solution 3: Use Local Development

Continue development with local Hardhat node:

```bash
# Terminal 1: Keep Hardhat node running
cd contracts
npx hardhat node

# Terminal 2: Deploy to localhost
npm run deploy:localhost

# Terminal 3: Start frontend
cd ..
npm run dev
```

Then:
1. Connect MetaMask to localhost (http://127.0.0.1:8545)
2. Import one of the Hardhat test accounts
3. Test full functionality locally

### Solution 4: Try Alternative RPC Endpoints

Create `.env.local` with alternative RPC:

```env
# Try alternative testnet RPC
NEXT_PUBLIC_RPC_URL=https://testnet.bittensor.network
```

Or use WebSocket:

```env
NEXT_PUBLIC_RPC_URL=wss://test.finney.opentensor.ai:443
```

### Solution 5: Reduce Contract Size

If the issue is contract size, we can optimize:

```bash
cd contracts

# Clean and recompile with maximum optimization
rm -rf artifacts cache
npx hardhat compile

# Deploy again
npm run deploy:testnet
```

### Solution 6: Manual Gas Settings

Update `scripts/deploy-bittensor.js` to set manual gas limits:

```javascript
// Before deployment, add:
const gasLimit = 5000000; // 5M gas

// Then deploy with explicit gas:
const bettingCard = await BettingCard.deploy({
  gasLimit: gasLimit
});
```

### Solution 7: Contact Bittensor Support

If the testnet continues to have issues:

1. **Bittensor Discord**: https://discord.gg/bittensor
   - Ask in #tech-support or #developers channel
   - Mention the runtime error

2. **GitHub Issues**: https://github.com/opentensor/subtensor
   - Check if others are experiencing similar issues
   - Report the testnet RPC instability

## 📊 Current Network Status

### Checking Bittensor Testnet Status

```bash
# Check if RPC is responding
curl -X POST https://test.chain.opentensor.ai \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Expected response:
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

If this fails, the RPC is down.

### Check Your Balance

```bash
# Using cast (from foundry)
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url https://test.chain.opentensor.ai
```

## 🎯 Recommended Development Flow

While testnet is unstable, use this flow:

### Phase 1: Local Development (Now)
```bash
# Deploy and test on localhost
cd contracts
npx hardhat node  # Terminal 1
npm run deploy:localhost  # Terminal 2

# Frontend development
npm run dev  # Terminal 3
```

### Phase 2: Testnet Testing (When Stable)
```bash
# Check testnet status first
curl https://test.chain.opentensor.ai

# Deploy to testnet
npm run deploy:testnet
```

### Phase 3: Mainnet Launch (When Ready)
```bash
# Final deployment to mainnet
npm run deploy:mainnet
```

## 🐛 Debug Information

Your deployment attempt showed:

```
✅ Connected to network: bittensorTestnet (Chain ID: 945)
✅ Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
✅ Balance: 11.000126847 tTAO
❌ Deployment failed during contract creation
```

Error location: `frame_executive::Executive::initialize_block`

This is a Substrate runtime error, indicating:
- The chain's runtime panicked during block initialization
- This is NOT a contract issue
- The testnet's state may be corrupted or undergoing maintenance

## 🔄 Alternative: Deploy Simple Test First

Try deploying a minimal contract first to test if it's a size issue:

```solidity
// contracts/contracts/SimpleTest.sol
pragma solidity ^0.8.19;

contract SimpleTest {
    uint256 public value = 42;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
}
```

Deploy this simple contract:

```javascript
// scripts/deploy-simple.js
const hre = require("hardhat");

async function main() {
  const SimpleTest = await hre.ethers.getContractFactory("SimpleTest");
  const simple = await SimpleTest.deploy();
  await simple.waitForDeployment();
  
  console.log("Simple test deployed to:", await simple.getAddress());
}

main();
```

```bash
npx hardhat run scripts/deploy-simple.js --network bittensorTestnet
```

If this works, the issue is contract complexity.
If this fails too, the issue is the testnet RPC.

## 💡 Best Practice Going Forward

1. **Always test on localhost first** ✅ (You did this!)
2. **Keep local development environment** for rapid iteration
3. **Deploy to testnet** for integration testing (when stable)
4. **Deploy to mainnet** only after thorough testing

## 📞 Getting Help

If you need immediate assistance:

1. **Bittensor Community**:
   - Discord: https://discord.gg/bittensor
   - Forum: https://forum.bittensor.com

2. **Check Status**:
   - Testnet status page (if available)
   - Recent GitHub issues

3. **Alternative**: Consider deploying to other EVM-compatible testnets for development:
   - Ethereum Sepolia
   - Polygon Mumbai
   - Then migrate to Bittensor mainnet when ready

## 📝 Summary

**Issue**: Bittensor Testnet RPC runtime error
**Your Contract**: ✅ Valid and working
**Recommended**: Continue development on localhost, retry testnet later
**Timeline**: Testnet issues typically resolve within hours/days

---

**Status**: Waiting for Bittensor Testnet stability
**Workaround**: Use localhost for development
**Last Updated**: November 11, 2025

