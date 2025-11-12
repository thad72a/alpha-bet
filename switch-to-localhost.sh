#!/bin/bash
echo "🔄 Switching to Localhost..."
cd /home/unicorn/alpha-bet

# Backup current config
cp .env.local .env.local.backup 2>/dev/null || true

# Restore localhost config
if [ -f .env.local.localhost.backup ]; then
    cp .env.local.localhost.backup .env.local
    echo "✅ Switched to localhost configuration"
else
    echo "❌ No localhost backup found!"
    echo "   You may need to reconfigure manually."
    exit 1
fi

# Clear Next.js cache
rm -rf .next

echo ""
echo "📋 Current settings:"
grep "NEXT_PUBLIC_CHAIN_ID" .env.local
grep "NEXT_PUBLIC_RPC_URL" .env.local
grep "NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS" .env.local
echo ""
echo "🚀 Now restart: npm run dev"
