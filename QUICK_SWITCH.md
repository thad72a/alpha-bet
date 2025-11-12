# Quick Environment Switch Guide

## 🏠 Switch to Localhost (Current Recommendation)

Your contract is **already deployed** on localhost!

```bash
# Use localhost config
cp .env.local.localhost .env.local

# Start frontend
npm run dev
```

**MetaMask Setup for Localhost**:
- Network Name: `Localhost 8545`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `1337`
- Currency: `ETH`

**Import Test Account**:
Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
(This is Hardhat's test account #0 with 10,000 ETH)

**Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## 🌐 Switch to Bittensor Testnet (When Stable)

```bash
# Update .env.local
cat > .env.local << 'EOF'
# Your real private key here
PRIVATE_KEY=your_actual_private_key_here

# Bittensor Testnet
NEXT_PUBLIC_NETWORK=bittensorTestnet
NEXT_PUBLIC_CHAIN_ID=945
NEXT_PUBLIC_RPC_URL=https://test.chain.opentensor.ai

# Will be filled after deployment
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://evm.taostats.io
EOF

# Deploy to testnet
cd contracts
npm run deploy:testnet

# Start frontend
cd ..
npm run dev
```

## 🚀 Current Status

### ✅ Working Now: Localhost
```
Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: Hardhat Local (Chain 1337)
Status: ✅ Fully functional
```

### ⏳ Waiting: Bittensor Testnet
```
Network: Bittensor Testnet (Chain 945)
Status: ⚠️ RPC performance issues
ETA: Check in a few hours
```

## 📋 Development Workflow

### Today: Local Development
1. ✅ Contract deployed on localhost
2. ✅ Frontend connects to localhost
3. ✅ Test all features locally
4. ✅ Create cards, place bets, test redemption

### Tomorrow: Try Testnet
1. Check if testnet is stable
2. Deploy to testnet
3. Test with real Bittensor network data

### Later: Mainnet Launch
1. Thorough testing complete
2. Deploy to mainnet
3. Go live!

## 🔄 Quick Test Commands

### Test Localhost Deployment
```bash
cd contracts

# Check contract exists
npx hardhat console --network localhost
> const BettingCard = await ethers.getContractFactory("BettingCard")
> const card = await BettingCard.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")
> await card.getCardCount()
```

### Test Bittensor Testnet (When Ready)
```bash
# Quick RPC check
curl -X POST https://test.chain.opentensor.ai \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# If fast response, try deployment
cd contracts
npm run deploy:testnet
```

## 🎯 What to Do Now

1. **Use localhost** for development ← DO THIS
2. **Test all features** on localhost
3. **Check testnet** in a few hours
4. **Deploy to testnet** when stable

---

**Current Recommendation**: **Use Localhost** until Bittensor Testnet stabilizes.

Your contract works perfectly - the only issue is testnet RPC performance! 🚀

