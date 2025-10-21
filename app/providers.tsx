'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, arbitrum, optimism],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Alpha Bet',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string, // Replace with your WalletConnect project ID
  chains,
})

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}


