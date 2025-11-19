'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { Chain } from 'wagmi/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { ToastProvider } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SubnetProvider } from '@/components/SubnetProvider'

// Define Localhost chain configuration for development
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

// Define Bittensor Testnet chain configuration
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
      http: ['https://test.chain.opentensor.ai'],
    },
    public: {
      http: ['https://test.chain.opentensor.ai'],
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

// Configure chains - Use localhost for development, or change to bittensorTestnet for testnet
const { chains, publicClient } = configureChains(
  [localhost, bittensorTestnet],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.id === 1337
          ? process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'
          : chain.id === 945 
          ? 'https://test.chain.opentensor.ai'
          : 'http://127.0.0.1:8545',
      }),
      // Increase polling interval to reduce RPC calls
      pollingInterval: 30_000, // 30 seconds (from default 4 seconds)
      stallTimeout: 10_000, // 10 seconds
    }),
  ],
  {
    // Enable batch requests to reduce RPC calls
    batch: {
      multicall: {
        wait: 100, // Wait 100ms before batching calls
      },
    },
    // Longer polling interval for contract reads
    pollingInterval: 30_000, // 30 seconds
    // Cache for 20 seconds to avoid duplicate requests
    cacheTime: 20_000,
  }
)

const { connectors } = getDefaultWallets({
  appName: 'Alpha Bet',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dummy-project-id',
  chains,
})

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

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


