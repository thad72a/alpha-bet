# Deployment Setup Instructions

## ⚠️ Issue: Missing PRIVATE_KEY

The deployment failed because `PRIVATE_KEY` is not set in your `.env.local` file.

## How to Fix

### Step 1: Get Your Private Key from MetaMask

1. Open MetaMask
2. Click on the three dots (⋮) next to your account
3. Click "Account details"
4. Click "Export Private Key"
5. Enter your MetaMask password
6. Copy the private key (starts with `0x`)

### Step 2: Update .env.local

Open or create `/home/unicorn/alpha-bet/.env.local` and add:

```env
# Deployment Private Key
PRIVATE_KEY=0x1234567890abcdef...your_actual_private_key_here

# Network Configuration
NEXT_PUBLIC_NETWORK=bittensorTestnet
NEXT_PUBLIC_CHAIN_ID=945
NEXT_PUBLIC_RPC_URL=https://test.chain.opentensor.ai

# Contract Addresses (will be filled after deployment)
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Block Explorer
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://evm.taostats.io
```

**⚠️ SECURITY WARNING:**
- NEVER commit `.env.local` to git (it's already in .gitignore)
- NEVER share your private key with anyone
- This key controls your wallet funds!

### Step 3: Fund Your Account with Test TAO

Before deploying, you need testnet TAO for gas fees:

1. Copy your wallet address (the one that matches the private key)
2. Visit: https://faucet.bittensor.com/
3. Enter your address
4. Request testnet TAO (tTAO)
5. Wait for confirmation (~30 seconds)

### Step 4: Deploy Again

```bash
cd /home/unicorn/alpha-bet/contracts
npm run deploy:testnet
```

## Quick Command to Set Up

You can quickly update your .env.local by running:

```bash
cd /home/unicorn/alpha-bet

# Option 1: Edit manually
nano .env.local

# Option 2: Use sed to add PRIVATE_KEY (replace YOUR_KEY with actual key)
echo 'PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE' >> .env.local
```

## Verify Your Setup

Check that your .env.local has the required variables:

```bash
grep -E "^(PRIVATE_KEY|NEXT_PUBLIC)" /home/unicorn/alpha-bet/.env.local
```

You should see at least:
- `PRIVATE_KEY=0x...`
- `NEXT_PUBLIC_NETWORK=bittensorTestnet`
- `NEXT_PUBLIC_CHAIN_ID=945`
- `NEXT_PUBLIC_RPC_URL=https://test.chain.opentensor.ai`

## Alternative: Use a Different Account

If you prefer to use a different account for deployment:

### Generate a New Account

```bash
cd /home/unicorn/alpha-bet/contracts
npx hardhat node --config hardhat.config.js
# This will show you test accounts with private keys
```

Or use an online tool:
- https://vanity-eth.tk/ (generate Ethereum keypair)
- Save the private key securely

## Troubleshooting

### "Error: No signers available"
- Make sure PRIVATE_KEY is set in .env.local
- Make sure it starts with `0x`
- Make sure there are no extra quotes around it

### "Error: Insufficient funds"
- Get testnet TAO from https://faucet.bittensor.com/
- Wait a few moments for the transaction to confirm
- Check your balance on https://evm.taostats.io

### "Error: Invalid private key"
- Make sure the private key is 64 hex characters (+ 0x prefix)
- No spaces or line breaks
- Format: `PRIVATE_KEY=0x1234567890abcdef...` (no quotes)

## Example .env.local (Complete)

```env
# Deployment Configuration
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Network Configuration
NEXT_PUBLIC_NETWORK=bittensorTestnet
NEXT_PUBLIC_CHAIN_ID=945
NEXT_PUBLIC_RPC_URL=https://test.chain.opentensor.ai

# Contract Addresses (auto-filled by deployment script)
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0

# Block Explorer
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://evm.taostats.io
```

## Next Steps

Once you've set up your `.env.local`:

1. **Compile contracts**: `cd contracts && npm run compile`
2. **Get test TAO**: https://faucet.bittensor.com/
3. **Deploy**: `npm run deploy:testnet`
4. **Start frontend**: `cd .. && npm run dev`

---

**Need Help?**
- Check `QUICK_START.md` for full setup guide
- Check `BITTENSOR_MIGRATION.md` for technical details
- Visit Bittensor Discord for community support

