# Deploy to Bittensor Testnet

## 🎯 Step-by-Step Guide

### Step 1: Add Your Private Key

Edit `.env.local` and replace `YOUR_PRIVATE_KEY_HERE` with your actual private key:

```bash
nano .env.local
# or
vim .env.local
```

**How to get your private key from MetaMask:**
1. Open MetaMask
2. Click the 3 dots (⋮) → Account Details
3. Click "Export Private Key"
4. Enter your password
5. Copy the private key (starts with `0x`)

**⚠️ SECURITY WARNING:**
- Never commit `.env.local` to git
- Never share your private key
- Only use testnet private keys (not your mainnet wallet!)

### Step 2: Get Testnet TAO

You need testnet TAO for gas fees:

1. **Get your wallet address**:
   ```bash
   # If you know it, skip this
   # Otherwise, check MetaMask
   ```

2. **Request testnet TAO from faucet**:
   - Visit: https://faucet.bittensor.com/
   - Enter your wallet address
   - Request tTAO
   - Wait for confirmation (~30 seconds)

3. **Verify you received tTAO**:
   ```bash
   # Check on explorer
   # Visit: https://evm.taostats.io/address/YOUR_ADDRESS
   ```

### Step 3: Test Testnet RPC

Before deploying, let's check if the testnet is stable:

```bash
cd /home/unicorn/alpha-bet
./test-bittensor-rpc.sh
```

If the RPC is slow or timing out, wait and try later.

### Step 4: Deploy Contract

```bash
cd contracts
npm run deploy:testnet
```

This will:
- ✅ Connect to Bittensor Testnet (Chain 945)
- ✅ Deploy BettingCard contract
- ✅ Save deployment address
- ✅ Auto-update `.env.local`

### Step 5: Verify Deployment

Check the deployment on the explorer:

```
https://evm.taostats.io/address/YOUR_CONTRACT_ADDRESS
```

### Step 6: Restart Frontend

```bash
cd /home/unicorn/alpha-bet
rm -rf .next
npm run dev
```

### Step 7: Configure MetaMask

Add Bittensor Testnet to MetaMask:

**Network Settings:**
```
Network Name:     Bittensor Testnet
RPC URL:          https://test.chain.opentensor.ai
Chain ID:         945
Currency Symbol:  tTAO
Block Explorer:   https://evm.taostats.io
```

### Step 8: Test the App

1. Open your app: `http://161.97.128.68:3000`
2. Connect MetaMask
3. Select "Bittensor Testnet"
4. Create a betting card!

## 🔄 Quick Commands

### Deploy to Testnet
```bash
# Make sure PRIVATE_KEY is set in .env.local
cd /home/unicorn/alpha-bet/contracts
npm run deploy:testnet
```

### Switch Back to Localhost
```bash
cd /home/unicorn/alpha-bet
cp .env.local.localhost.backup .env.local
rm -rf .next
npm run dev
```

### Switch to Testnet
```bash
cd /home/unicorn/alpha-bet
# Make sure .env.local has your private key and testnet config
rm -rf .next
npm run dev
```

## 🐛 Troubleshooting

### Error: "No signers available"

**Problem**: PRIVATE_KEY not set or invalid

**Fix**:
```bash
# Check if PRIVATE_KEY is set
grep PRIVATE_KEY .env.local

# Should show something like:
# PRIVATE_KEY=0x1234567890abcdef...

# If it shows YOUR_PRIVATE_KEY_HERE, you need to update it
nano .env.local
```

### Error: "Insufficient funds"

**Problem**: No testnet TAO in your wallet

**Fix**:
1. Get tTAO from https://faucet.bittensor.com/
2. Wait for transaction to confirm
3. Try deployment again

### Error: "wasm trap: unreachable"

**Problem**: Bittensor Testnet RPC is having issues (we saw this earlier)

**Fix Options**:

**Option A: Wait and Retry**
- Testnet RPC may be temporarily unstable
- Wait 30-60 minutes
- Try again: `npm run deploy:testnet`

**Option B: Use Localhost for Development**
```bash
cp .env.local.localhost.backup .env.local
# Continue development on localhost
# Try testnet later
```

**Option C: Deploy to Mainnet (⚠️ Uses Real TAO)**
```bash
# Only if you have real TAO and are ready for production
npm run deploy:mainnet
```

### Error: "Transaction timeout"

**Problem**: RPC is slow

**Fix**:
```bash
# Increase timeout in hardhat.config.js
# Already set to 60000ms (60 seconds)
# If still timing out, testnet may be down
```

## 📊 Check Testnet Status

### Quick RPC Test
```bash
curl -X POST https://test.chain.opentensor.ai \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  --max-time 5
```

**Good response** (fast):
```json
{"jsonrpc":"2.0","id":1,"result":"0x587d1a"}
```

**Bad response** (slow or timeout):
- Takes >5 seconds
- Returns error
- No response

## 🎯 Expected Output

When deployment succeeds, you'll see:

```
🚀 Starting deployment to Bittensor Testnet...

📡 Network: bittensorTestnet
🔗 Chain ID: 945n
👤 Deploying with account: 0xYourAddress
💰 Account balance: 11.234567 tTAO

📝 Deploying BettingCard contract...
⏳ Waiting for deployment transaction...
✅ BettingCard deployed to: 0xABCD1234...

💾 Deployment info saved to deployment-addresses.json
✅ .env.local file created!

===========================================================
🎉 DEPLOYMENT SUCCESSFUL!
===========================================================
Network: bittensorTestnet
Chain ID: 945
BettingCard Contract: 0xABCD1234...
Block Explorer: https://evm.taostats.io/address/0xABCD1234...
===========================================================
```

## 📝 Important Notes

### Gas Fees
- Testnet deployment costs ~0.001-0.01 tTAO
- Make sure you have at least 0.1 tTAO
- Gas fees are paid in tTAO (not ETH)

### Contract Address Changes
- Each deployment creates a NEW contract address
- Old addresses won't work anymore
- `.env.local` is auto-updated with new address

### Network Switching
- MetaMask must be on correct network
- Frontend must be restarted after changing `.env.local`
- Clear browser cache if issues persist

## ✅ Verification Checklist

Before deployment:
- [ ] Private key added to `.env.local`
- [ ] Wallet has testnet TAO (>0.1 tTAO)
- [ ] Testnet RPC is responding (fast)
- [ ] No Hardhat node running locally

After deployment:
- [ ] Contract address in `.env.local`
- [ ] Contract visible on explorer
- [ ] Frontend restarted (`npm run dev`)
- [ ] MetaMask on Bittensor Testnet
- [ ] Can create cards in the app

---

**Ready to Deploy?** Follow Step 1-8 above! 🚀


