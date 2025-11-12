#!/bin/bash

echo "🔄 Restarting AlphaBet Development Environment..."
echo ""

# Step 1: Kill old processes
echo "1️⃣ Killing old dev servers..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

# Step 2: Clear Next.js cache
echo "2️⃣ Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache 2>/dev/null || true

# Step 3: Verify Hardhat is running
echo "3️⃣ Checking Hardhat node..."
if ! nc -z localhost 8545 2>/dev/null; then
    echo "⚠️  Hardhat node not running!"
    echo "   Run in another terminal: cd contracts && npx hardhat node"
    exit 1
fi

# Step 4: Verify contract is deployed
echo "4️⃣ Verifying contract deployment..."
cd contracts
node check-contract.js --network localhost
cd ..

# Step 5: Show environment
echo "5️⃣ Current configuration:"
echo "   Contract: $(grep NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS .env.local | cut -d= -f2)"
echo "   Network: $(grep NEXT_PUBLIC_CHAIN_ID .env.local | cut -d= -f2)"
echo "   RPC: $(grep NEXT_PUBLIC_RPC_URL .env.local | cut -d= -f2)"
echo ""

echo "✅ Ready to start!"
echo ""
echo "🚀 Now run: npm run dev"
echo ""
echo "📱 Then in browser:"
echo "   1. Open http://localhost:3000"
echo "   2. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "   3. Connect MetaMask to localhost:8545"
echo ""

