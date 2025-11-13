# Remote Access Configuration - FIXED!

## ✅ What Was Fixed

### Problem
You were accessing the frontend from `http://161.97.128.68:3000` (remote), but it was trying to connect to `http://127.0.0.1:8545` (localhost), which doesn't work from a remote browser.

### Solution
1. ✅ **Hardhat node** now listens on `0.0.0.0:8545` (all interfaces)
2. ✅ **RPC URL** updated to `http://161.97.128.68:8545`
3. ✅ **Contract redeployed** to the new Hardhat instance
4. ✅ **Frontend configured** to use remote RPC

## 🚀 What You Need to Do Now

### 1. Restart Your Dev Server

```bash
# Stop current dev server (Ctrl+C)
# Then start fresh:
npm run dev
```

### 2. Configure MetaMask for Remote Hardhat

Add a **new custom network** in MetaMask:

```
Network Name:     Remote Hardhat
RPC URL:          http://161.97.128.68:8545
Chain ID:         1337
Currency Symbol:  ETH
```

### 3. Import Test Account

Click "Import Account" in MetaMask and paste:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This is Hardhat's test account #0 with 10,000 ETH.

### 4. Access the App

```
URL: http://161.97.128.68:3000
```

Then:
1. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Connect MetaMask
3. Select "Remote Hardhat" network
4. Start testing!

## 📋 Current Configuration

```
Frontend:     http://161.97.128.68:3000
Hardhat RPC:  http://161.97.128.68:8545
Chain ID:     1337
Contract:     0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 🔍 Verify It's Working

### Check Hardhat Node
```bash
curl http://161.97.128.68:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Should return a block number.

### Check Contract
```bash
cd contracts
npx hardhat run check-contract.js --network localhost
```

Should show: `✅ Contract exists`

## ⚠️ Important Notes

### Security Warning
**Hardhat node is now accessible from the internet!** This is fine for development, but:
- ✅ **DO**: Use for testing and development
- ❌ **DON'T**: Use with real private keys or real funds
- ❌ **DON'T**: Leave running in production

### Firewall
If you still get connection errors, you may need to open port 8545:

```bash
# Ubuntu/Debian
sudo ufw allow 8545/tcp

# Or check if firewall is blocking
sudo ufw status
```

### Keep Hardhat Running
The Hardhat node is now running in the background. To keep it running:
- Don't restart the server unnecessarily
- Check it's running: `ps aux | grep hardhat`
- If it stops, restart with: `cd contracts && npx hardhat node --hostname 0.0.0.0`

## 🐛 Troubleshooting

### Still Getting CORS Errors?

1. **Clear browser cache completely**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files

2. **Hard refresh**
   - `Ctrl+Shift+R` or `Cmd+Shift+R`

3. **Try incognito/private window**
   - Rules out browser cache issues

### Can't Connect to Hardhat?

```bash
# Check if Hardhat is running
ps aux | grep hardhat

# Check if port 8545 is open
netstat -tulpn | grep 8545

# Restart Hardhat if needed
pkill -f "hardhat node"
cd /home/unicorn/alpha-bet/contracts
npx hardhat node --hostname 0.0.0.0 &

# Redeploy contract
npm run deploy:localhost
```

### MetaMask Shows Wrong Network?

Make sure you:
1. Added the network with RPC: `http://161.97.128.68:8545`
2. Selected this network in MetaMask
3. Imported the test account

## 🔄 Alternative: SSH Tunnel (More Secure)

If you prefer not to expose Hardhat to the internet, use SSH tunnel:

```bash
# On your local machine:
ssh -L 8545:localhost:8545 user@161.97.128.68

# Then in MetaMask use:
# RPC URL: http://localhost:8545
```

This is more secure but requires SSH access.

## 📚 Files Modified

1. ✅ `.env.local` - Updated RPC URL to remote IP
2. ✅ `app/providers.tsx` - Uses env var for RPC URL
3. ✅ Hardhat node started with `--hostname 0.0.0.0`

## ✅ Summary

**Before**:
- Hardhat: `127.0.0.1:8545` (local only) ❌
- Frontend tried to access localhost from remote browser ❌

**After**:
- Hardhat: `0.0.0.0:8545` (accessible remotely) ✅
- RPC URL: `http://161.97.128.68:8545` ✅
- Frontend can connect from anywhere ✅

---

**Status**: ✅ Fixed! Restart dev server and access from `http://161.97.128.68:3000`
**Last Updated**: November 11, 2025





