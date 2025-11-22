'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { Chain } from 'wagmi/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { ToastProvider } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SubnetProvider } from '@/components/SubnetProvider'
import { RPC_POLLING_INTERVAL, RPC_STALL_TIMEOUT, RPC_BATCH_WAIT } from '@/lib/constants'

// Define Bittensor Mainnet (default network)
const bittensorMainnet: Chain = {
  id: 966,
  name: 'Bittensor',
  network: 'bittensor-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TAO',
    symbol: 'TAO',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_LITE_CHAIN_RPC_URL || 'https://lite.chain.opentensor.ai'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_LITE_CHAIN_RPC_URL || 'https://lite.chain.opentensor.ai'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Taostats EVM Explorer', 
      url: 'https://evm.taostats.io' 
    },
  },
  testnet: false,
}

// Define Bittensor Testnet
const bittensorTestnet: Chain = {
  id: 945,
  name: 'Bittensor Testnet',
  network: 'bittensor-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Test TAO',
    symbol: 'tTAO',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_TEST_CHAIN_RPC_URL || 'https://test.chain.opentensor.ai'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_TEST_CHAIN_RPC_URL || 'https://test.chain.opentensor.ai'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Taostats EVM Explorer', 
      url: 'https://evm.taostats.io' 
    },
  },
  testnet: true,
}

// Determine which chains to include based on environment
const isDevelopment = process.env.NODE_ENV === 'development'

// Localhost chain (only in development)
const localhost: Chain = {
  id: 1337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
}

// Configure available chains - Mainnet is default, Testnet is option to switch
const availableChains = isDevelopment 
  ? [bittensorMainnet, bittensorTestnet, localhost]  // Dev: Include localhost
  : [bittensorMainnet, bittensorTestnet]             // Production: Only Bittensor networks

const { chains, publicClient } = configureChains(
  availableChains,
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id === 966) {
          return { http: process.env.NEXT_PUBLIC_LITE_CHAIN_RPC_URL || 'https://lite.chain.opentensor.ai' }
        } else if (chain.id === 945) {
          return { http: process.env.NEXT_PUBLIC_TEST_CHAIN_RPC_URL || 'https://test.chain.opentensor.ai' }
        } else if (chain.id === 1337) {
          return { http: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545' }
        }
        return { http: process.env.NEXT_PUBLIC_LITE_CHAIN_RPC_URL || 'https://lite.chain.opentensor.ai' } // Fallback to mainnet
      },
    }),
  ],
  {
    // Longer polling interval for contract reads - reduces RPC calls by 87.5%
    pollingInterval: RPC_POLLING_INTERVAL,
    // Increase stall timeout
    stallTimeout: RPC_STALL_TIMEOUT,
  }
)

const { connectors } = getDefaultWallets({
  appName: 'PriceMarkets',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dummy-project-id',
  chains,
})

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

// Log network configuration
if (typeof window !== 'undefined') {
  console.log('🌐 Available Networks:', availableChains.map(c => `${c.name} (${c.id})`).join(', '))
  console.log('✅ Default Network: Bittensor Mainnet (966)')
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={chains}>
          <SubnetProvider>
            {children}
          </SubnetProvider>
          <ToastProvider />
        </RainbowKitProvider>
      </WagmiConfig>
    </ErrorBoundary>
  )
}


