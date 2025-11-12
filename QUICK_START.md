# Quick Start Guide - Bittensor Alpha Bet

## 🚀 Ready to Deploy with Native TAO!

This project now uses **native Bittensor TAO** on Bittensor EVM. No mock tokens needed!

## Prerequisites

✅ Node.js 18+
✅ MetaMask or EVM wallet
✅ Test TAO from Bittensor faucet

## Setup (3 Steps)

### 1. Install Dependencies

```bash
npm install
cd contracts && npm install && cd ..
```

### 2. Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` and add your private key:
```env
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Get Test TAO

Visit: https://faucet.bittensor.com/
- Enter your wallet address
- Request testnet TAO (tTAO)
- Wait for confirmation

## Deploy to Bittensor Testnet

```bash
cd contracts
npm run compile
npm run deploy:testnet
```

The script will:
- Deploy BettingCard contract
- Create `.env.local` with contract address
- Show you setup instructions

## Configure MetaMask

Add Bittensor Testnet to MetaMask:

**Network Settings:**
- Network Name: `Bittensor Testnet`
- RPC URL: `https://test.chain.opentensor.ai`
- Chain ID: `945`
- Currency Symbol: `tTAO`
- Block Explorer: `https://evm.taostats.io`

## Start Frontend

```bash
npm run dev
```

Open http://localhost:3000 🎉

## Usage

### Create a Betting Card

1. Connect MetaMask
2. Click "Create Card"
3. Select subnet
4. Set target price
5. Set deadline
6. Confirm transaction

### Place a Bet

1. Browse available cards
2. Choose YES or NO (or multiple options)
3. Enter amount in TAO
4. Confirm transaction (includes 2.5% fee)

### Redeem Winnings

1. Wait for card resolution
2. Click "Redeem" on winning cards
3. Receive TAO payout

## Address Formats

Bittensor supports two types:

**SS58 (Polkadot)**: 5Grwv...utQY
- For native chain operations
- Use Polkadot.js wallet

**H160 (EVM)**: 0x742d...5f0bEb
- For smart contracts ✅
- Use MetaMask

**For this dApp**: You need H160 (MetaMask)

## Testing

Run smart contract tests:

```bash
cd contracts
npm test
```

Expected output: `6 passing`

## Deploy to Mainnet

⚠️ Uses real TAO!

```bash
cd contracts
npm run deploy:mainnet
```

Update `.env.local`:
```env
NEXT_PUBLIC_NETWORK=bittensorMainnet
NEXT_PUBLIC_CHAIN_ID=966
NEXT_PUBLIC_RPC_URL=https://lite.chain.opentensor.ai
```

## Troubleshooting

### Transaction Fails
- Check you have enough TAO for amount + gas
- Verify betting period hasn't ended
- Ensure card isn't resolved

### Wrong Address Format
- Use MetaMask for H160 addresses
- Check `lib/bittensor-wallet.ts` utilities

### Network Not Found
- Manually add Bittensor Testnet to MetaMask
- Use network details from this guide

## Key Files

- `contracts/contracts/BettingCard.sol` - Main smart contract
- `contracts/scripts/deploy-bittensor.js` - Deployment script
- `lib/bittensor-wallet.ts` - Address utilities
- `BITTENSOR_MIGRATION.md` - Full migration details

## Resources

- 📚 [Full Documentation](./README.md)
- 🔧 [Smart Contract Setup](./SMART_CONTRACT_SETUP.md)
- 🔄 [Migration Guide](./BITTENSOR_MIGRATION.md)
- 🌐 [Bittensor Docs](https://docs.bittensor.com/)
- 🔍 [EVM Explorer](https://evm.taostats.io)
- 💧 [Testnet Faucet](https://faucet.bittensor.com/)

## Support

- **Bittensor Discord**: Community support
- **GitHub Issues**: Bug reports and features
- **EVM Explorer**: Transaction debugging

---

**Ready to Build!** 🚀

All mockTAO code has been removed. The system now uses native Bittensor TAO with full support for SS58 and H160 addresses.

