#!/bin/bash
echo "🔄 Switching to Bittensor Testnet..."
cd /home/unicorn/alpha-bet

# Check if private key is set
if grep -q "YOUR_PRIVATE_KEY_HERE" .env.local; then
    echo "❌ Error: PRIVATE_KEY not set in .env.local!"
    echo ""
    echo "Please edit .env.local and add your private key:"
    echo "   nano .env.local"
    echo ""
    echo "Replace YOUR_PRIVATE_KEY_HERE with your actual key."
    exit 1
fi

# Clear Next.js cache
rm -rf .next

echo "✅ Switched to testnet configuration"
echo ""
echo "📋 Current settings:"
grep "NEXT_PUBLIC_CHAIN_ID" .env.local
grep "NEXT_PUBLIC_RPC_URL" .env.local
grep "NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS" .env.local
echo ""
echo "🧪 Testing RPC..."
./test-bittensor-rpc.sh
echo ""
echo "🚀 If RPC is good, restart: npm run dev"
