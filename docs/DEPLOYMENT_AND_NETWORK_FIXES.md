# Deployment & Network Configuration Fixes

## Issues Fixed

### 1. ✅ Deploy Script Now Only Updates Contract Address

**Problem:** Deploy script was overwriting entire `.env.local` file, losing all other configuration (Supabase, WalletConnect, etc.)

**Solution:** Modified `contracts/scripts/deploy-bittensor.js` to:
- Read existing `.env.local` file
- Only update/add `NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS` line
- Preserve all other environment variables
- Create minimal file if `.env.local` doesn't exist

**Before:**
```javascript
// Overwrote entire .env.local file
fs.writeFileSync(envPath, envContent);
```

**After:**
```javascript
// Only update contract address line
if (envContent.includes('NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=')) {
  envContent = envContent.replace(
    /NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=.*/,
    `NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=${bettingCardAddress}`
  );
}
```

**Now When You Deploy:**
```bash
npm run deploy:testnet
# ✅ Only updates: NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=0x...
# ✅ Keeps: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, etc.
```

---

### 2. ✅ Default Network is Now Bittensor Mainnet

**Problem:** Wallet connections defaulted to `localhost (1337)` network

**Solution:** Reconfigured `app/providers.tsx`:
- **Bittensor Mainnet (966)** is now the default network
- **Bittensor Testnet (945)** is available to switch to
- **Localhost (1337)** only shows in development mode

**Network Priority (in order):**
1. 🟢 **Bittensor Mainnet** (Chain ID: 966) - Default
2. 🟡 **Bittensor Testnet** (Chain ID: 945) - Switchable
3. ⚪ **Localhost** (Chain ID: 1337) - Dev only

**Production:** Only Mainnet & Testnet available  
**Development:** All three networks available

---

## Network Configuration Details

### Bittensor Mainnet (Default)
```typescript
{
  id: 966,
  name: 'Bittensor',
  symbol: 'TAO',
  rpc: 'https://lite.chain.opentensor.ai',
  explorer: 'https://evm.taostats.io'
}
```

### Bittensor Testnet (Switchable)
```typescript
{
  id: 945,
  name: 'Bittensor Testnet',
  symbol: 'tTAO',
  rpc: 'https://test.chain.opentensor.ai',
  explorer: 'https://evm.taostats.io'
}
```

### Localhost (Dev Only)
```typescript
{
  id: 1337,
  name: 'Localhost',
  symbol: 'ETH',
  rpc: 'http://127.0.0.1:8545'
}
```

---

## How Network Selection Works Now

### For Users:

1. **Connect Wallet** → Defaults to Bittensor Mainnet (966)
2. **Want to use Testnet?** → Switch network in wallet
3. **In Development?** → Can also use localhost

### In Wallet (MetaMask, etc.):

When user clicks "Connect Wallet":
- If wallet has Bittensor Mainnet → Connects to mainnet ✅
- If wallet only has Testnet → Prompts to add/switch to mainnet
- User can manually switch networks anytime

---

## Deployment Workflow (Improved)

### Deploy to Testnet:
```bash
cd contracts
npm run deploy:testnet
```

**What Happens:**
1. ✅ Deploys contract to Bittensor Testnet
2. ✅ Updates only `NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS` in `.env.local`
3. ✅ Keeps all other env vars intact
4. ✅ Saves deployment info to `deployment-addresses.json`

**Your `.env.local` after deployment:**
```bash
# Supabase (unchanged ✅)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# WalletConnect (unchanged ✅)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123

# Contract Address (UPDATED ✅)
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=0x1234567890abcdef...
```

### Deploy to Mainnet:
```bash
cd contracts
npm run deploy:mainnet
```

Same behavior - only updates contract address!

---

## Environment Variable Management

### Recommended `.env.local` Structure:
```bash
# ============================================
# Network Configuration
# ============================================
# These are set by default in code:
# Mainnet RPC: https://lite.chain.opentensor.ai
# Testnet RPC: https://test.chain.opentensor.ai

# ============================================
# Smart Contract (Updated by deploy script)
# ============================================
NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS=0x...

# ============================================
# Supabase (Manual configuration)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ============================================
# WalletConnect (Manual configuration)
# ============================================
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# ============================================
# Backend (Optional)
# ============================================
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Network Detection & Logging

### Browser Console Output:
When you load the app, you'll see:
```
🌐 Available Networks: Bittensor (966), Bittensor Testnet (945)
✅ Default Network: Bittensor Mainnet (966)
```

In development:
```
🌐 Available Networks: Bittensor (966), Bittensor Testnet (945), Localhost (1337)
✅ Default Network: Bittensor Mainnet (966)
```

---

## User Experience Changes

### Before:
❌ Connect wallet → Defaults to localhost (1337)  
❌ User confused: "Why is it asking for localhost?"  
❌ Have to manually switch to Bittensor

### After:
✅ Connect wallet → Defaults to Bittensor Mainnet (966)  
✅ Wallet prompts to add Bittensor network if not present  
✅ Can switch to Testnet in wallet if needed  
✅ Production users never see localhost option

---

## Testing Checklist

### Deployment Script:
- [ ] Deploy to testnet
- [ ] Check `.env.local` - only contract address updated
- [ ] Verify Supabase env vars still there
- [ ] Verify WalletConnect env var still there
- [ ] Check `deployment-addresses.json` created/updated

### Network Configuration:
- [ ] Fresh connection → Defaults to Mainnet (966)
- [ ] Can switch to Testnet (945) in wallet
- [ ] Localhost only visible in development
- [ ] Production build doesn't show localhost
- [ ] Console logs show correct networks

### User Flow:
- [ ] Connect wallet → Bittensor Mainnet prompt
- [ ] Switch network in wallet → App updates
- [ ] Contract calls go to correct network
- [ ] Block explorer links use correct network

---

## Migration Notes

### For Existing Deployments:

**No action needed!** The changes are backward compatible.

If you want to use mainnet:
1. Deploy contract to mainnet: `npm run deploy:mainnet`
2. Contract address will be updated in `.env.local`
3. Users will default to mainnet network

If you want to keep using testnet:
1. Keep your current testnet deployment
2. Users can switch to testnet in their wallet
3. Everything still works

---

## Troubleshooting

### Issue: "Wrong network" error
**Solution:** User needs to switch to the correct network in their wallet

### Issue: Deploy script still overwrites .env.local
**Solution:** Make sure you pulled latest changes to `contracts/scripts/deploy-bittensor.js`

### Issue: Localhost still showing in production
**Solution:** Check `NODE_ENV=production` is set in your production environment

### Issue: Can't connect to Bittensor
**Solution:** 
1. Add Bittensor network to wallet manually:
   - Chain ID: 966 (Mainnet) or 945 (Testnet)
   - RPC: https://lite.chain.opentensor.ai (Mainnet)
   - Symbol: TAO

---

## Summary

✅ **Deploy script fixed** - Only updates contract address  
✅ **Network config fixed** - Defaults to Bittensor Mainnet  
✅ **Testnet available** - Users can switch to testnet  
✅ **Localhost hidden** - Only shows in development  
✅ **Better UX** - No more localhost confusion  
✅ **Preserved config** - Supabase, WalletConnect, etc. safe  

**Users now connect to Bittensor Mainnet by default, with option to switch to Testnet!** 🎉

