'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { Chain } from 'wagmi/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { ToastProvider } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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

// Configure chains - Bittensor testnet as primary
const { chains, publicClient } = configureChains(
  [bittensorTestnet],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.id === 945 
          ? 'https://test.chain.opentensor.ai'
          : 'http://127.0.0.1:8545',
      }),
    }),
  ]
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
          {children}
          <ToastProvider />
        </RainbowKitProvider>
      </WagmiConfig>
    </ErrorBoundary>
  )
}


