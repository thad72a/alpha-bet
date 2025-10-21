# Alpha Bet - Bittensor Subnet Price Predictions

A decentralized prediction market platform for Bittensor subnet alpha token prices, similar to Polymarket but specifically designed for the Bittensor ecosystem.

## Overview

Alpha Bet allows users to create and participate in prediction markets for Bittensor subnet alpha token prices. Users can:

- Create betting cards for specific subnet alpha price predictions
- Bet on whether alpha tokens will reach certain prices by specific timestamps
- Trade YES/NO shares in prediction markets
- Earn rewards for correct predictions

## Features

### Smart Contract (Solidity)
- **BettingCard Contract**: Manages all betting functionality
- **Share Trading**: Users can buy/sell YES/NO shares
- **Automatic Resolution**: Cards resolve based on actual alpha prices
- **Fee System**: Platform takes a small fee from each transaction
- **Liquidity Pool**: All bets contribute to a shared liquidity pool

### Frontend (Next.js + React)
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Wallet Integration**: Connect with MetaMask, WalletConnect, etc.
- **Real-time Data**: Fetches current subnet data and alpha prices
- **Market Creation**: Easy interface to create new prediction markets
- **Trading Interface**: Intuitive share purchasing system

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
- MetaMask or compatible wallet

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install contract dependencies:**
```bash
cd contracts
npm install
```

3. **Compile contracts:**
```bash
cd contracts
npm run compile
```

4. **Start development server:**
```bash
npm run dev
```

### Smart Contract Deployment

1. **Start local blockchain:**
```bash
cd contracts
npx hardhat node
```

2. **Deploy contracts:**
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

3. **Update contract addresses** in the frontend code

## How It Works

### Creating a Betting Card
1. User selects a subnet from available Bittensor subnets
2. Sets a target alpha price and deadline timestamp
3. Pays gas fees to create the card on-chain
4. Card becomes available for other users to bet on

### Placing Bets
1. Users browse available betting cards
2. Choose YES or NO shares (or both)
3. Purchase shares with TAO tokens
4. Shares are stored on-chain and can be redeemed after resolution

### Resolution
1. Cards automatically resolve at the specified timestamp
2. Actual alpha price is compared to the predicted price
3. Users with winning shares can redeem them for TAO
4. Losing shares become worthless

## Technical Details

### Smart Contract Features
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Contract owner can resolve cards and manage fees
- **ERC20 Integration**: Uses TAO token for all transactions
- **Gas Optimized**: Efficient storage and computation

### Frontend Features
- **TypeScript**: Full type safety
- **Wagmi**: Modern React hooks for Ethereum
- **RainbowKit**: Beautiful wallet connection UI
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Live data from Bittensor

## Security Considerations

- All funds are held in the smart contract
- Users can only redeem shares after resolution
- Platform fees are clearly disclosed
- No admin can steal user funds
- Cards resolve based on verifiable on-chain data

## Future Enhancements

- [ ] Integration with Bittensor API for real-time price data
- [ ] Advanced charting and analytics
- [ ] Mobile app development
- [ ] Governance token for platform decisions
- [ ] Cross-chain support for other tokens
- [ ] Automated market making
- [ ] Social features and user profiles

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


