# Alpha Bet - Bittensor Subnet Price Predictions

A decentralized prediction market platform for Bittensor subnet alpha token prices, built on **Bittensor EVM**. Similar to Polymarket but specifically designed for the Bittensor ecosystem.

## Overview

Alpha Bet allows users to create and participate in prediction markets for Bittensor subnet alpha token prices using **native TAO**. Users can:

- Create betting cards for specific subnet alpha price predictions (YES/NO or multiple options)
- Bet on whether alpha tokens will reach certain prices by specific timestamps
- Trade shares in prediction markets using native TAO
- Earn rewards for correct predictions
- Support for both **Polkadot (SS58)** and **EVM (H160)** wallet addresses

## Features

### Smart Contract (Solidity)
- **BettingCard Contract**: Manages all betting functionality on Bittensor EVM
- **Native TAO**: Uses native TAO tokens (no wrapped tokens needed)
- **Binary & Multi-Option Markets**: Create YES/NO or multiple choice predictions
- **Share Trading**: Users can buy/sell shares with native TAO
- **Automatic Resolution**: Cards resolve based on actual alpha prices
- **Fee System**: Platform takes a 2.5% fee from each transaction
- **Liquidity Pool**: All bets contribute to a shared liquidity pool
- **Gas Optimized**: Efficient storage and computation

### Frontend (Next.js + React)
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Bittensor EVM Integration**: Direct connection to Bittensor testnet/mainnet
- **Dual Address Support**: Works with both SS58 (Polkadot) and H160 (EVM) addresses
- **Wallet Integration**: Connect with MetaMask, WalletConnect, and Polkadot.js
- **Real-time Data**: Fetches current subnet data and alpha prices
- **Market Creation**: Easy interface to create new prediction markets
- **Trading Interface**: Intuitive share purchasing system with native TAO

## Project Structure

```
alpha-bet/
├── contracts/                 # Smart contracts
│   ├── BettingCard.sol       # Main betting contract
│   ├── hardhat.config.js     # Hardhat configuration
│   └── package.json          # Contract dependencies
├── app/                      # Next.js app directory
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── providers.tsx        # Web3 providers
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── BettingCard.tsx      # Individual betting card
│   └── CreateCardModal.tsx  # Card creation modal
├── lib/                     # Utilities
│   ├── bittensor.ts         # Bittensor data fetching
│   └── utils.ts             # General utilities
├── types/                   # TypeScript types
│   └── subnet.ts            # Subnet data types
└── package.json             # Frontend dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible EVM wallet (for H160 addresses)
- Optional: Polkadot.js wallet extension (for SS58 addresses)
- Test TAO tokens from Bittensor testnet faucet

### Installation

1. **Install all dependencies:**
```bash
npm install
cd contracts && npm install && cd ..
```

2. **Set up environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your values
```

3. **Compile contracts:**
```bash
cd contracts
npm run compile
```

### Smart Contract Deployment

#### Deploy to Bittensor Testnet

1. **Add private key to `.env.local`:**
```env
PRIVATE_KEY=your_private_key_here
```

2. **Fund your account** with testnet TAO from the [Bittensor Testnet Faucet](https://faucet.bittensor.com/)

3. **Deploy to testnet:**
```bash
cd contracts
npm run deploy:testnet
```

4. **Restart dev server** to pick up new contract addresses:
```bash
npm run dev
```

#### Deploy to Bittensor Mainnet

```bash
cd contracts
npm run deploy:mainnet
```

**⚠️ Warning**: Make sure you have real TAO for gas fees on mainnet!

#### Local Development (Optional)

For local testing with Hardhat:

```bash
# Terminal 1: Start local Hardhat node
cd contracts
npm run node

# Terminal 2: Deploy to localhost
npm run deploy:localhost

# Terminal 3: Start frontend
npm run dev
```

## How It Works

### Creating a Betting Card
1. User selects a subnet from available Bittensor subnets
2. Sets a target alpha price and deadline timestamp
3. Pays gas fees to create the card on-chain
4. Card becomes available for other users to bet on

### Placing Bets
1. Connect your wallet (MetaMask for EVM/H160 addresses)
2. Ensure you have native TAO in your wallet
3. Browse available betting cards
4. Choose YES or NO shares (or specific options for multi-choice markets)
5. Purchase shares with native TAO (includes 2.5% platform fee)
6. Shares are stored on-chain and can be redeemed after resolution

### Resolution
1. Cards automatically resolve at the specified timestamp
2. Actual alpha price is compared to the predicted price
3. Users with winning shares can redeem them for TAO
4. Losing shares become worthless

## Technical Details

### Smart Contract Features
- **Native TAO Payments**: Uses Solidity `payable` functions for native TAO transfers
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Contract owner can resolve cards and manage fees
- **No Token Contract**: Direct integration with native TAO (no wrapping needed)
- **Gas Optimized**: Efficient storage and computation
- **Multi-Market Support**: Both binary (YES/NO) and multi-option markets

### Frontend Features
- **TypeScript**: Full type safety
- **Wagmi v1**: Modern React hooks for Ethereum/EVM
- **RainbowKit**: Beautiful wallet connection UI
- **Bittensor EVM**: Native integration with Bittensor testnet (Chain ID: 945) and mainnet (Chain ID: 966)
- **Address Utilities**: Helper functions for SS58 and H160 address formats
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Live data from Bittensor

### Network Configuration

**Bittensor Testnet**
- Chain ID: 945
- RPC URL: https://test.chain.opentensor.ai
- Currency: tTAO (Test TAO)
- Explorer: https://evm.taostats.io

**Bittensor Mainnet**
- Chain ID: 966
- RPC URL: https://lite.chain.opentensor.ai
- Currency: TAO
- Explorer: https://evm.taostats.io

## Security Considerations

- All funds are held in the smart contract
- Users can only redeem shares after resolution
- Platform fees are clearly disclosed
- No admin can steal user funds
- Cards resolve based on verifiable on-chain data

## Address Format Support

Bittensor supports two address formats:

1. **SS58 (Substrate/Polkadot)**: Used for native Bittensor chain operations
   - Example: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
   - Used with Polkadot.js wallet
   
2. **H160 (EVM/Ethereum)**: Used for smart contract interactions on Bittensor EVM
   - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Used with MetaMask and other EVM wallets

**For Alpha Bet**: You need an H160 (EVM) address to interact with the smart contracts. Use MetaMask or another EVM-compatible wallet.

## Future Enhancements

- [x] Native TAO integration (no wrapped tokens)
- [x] Multi-option market support
- [x] Bittensor EVM deployment
- [ ] Integration with Bittensor API for real-time price data
- [ ] Advanced charting and analytics
- [ ] Oracle integration for automated resolution
- [ ] Mobile app development
- [ ] Governance token for platform decisions
- [ ] Automated market making (AMM)
- [ ] Social features and user profiles
- [ ] Cross-subnet prediction markets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This is experimental software. Use at your own risk. Always verify smart contracts before interacting with them.


