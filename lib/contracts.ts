/**
 * Smart Contract Configuration
 * Deployed contract addresses and ABIs for Bittensor network
 */

import { BETTING_ABI } from './abis'

// Deployed contract addresses
export const BETTING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS as `0x${string}`

// Export ABI
export { BETTING_ABI }

// Network configuration
export const BITTENSOR_TESTNET_CHAIN_ID = 945
export const BITTENSOR_MAINNET_CHAIN_ID = 966
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://test.chain.opentensor.ai'

// Contract configuration object for easy import
export const contracts = {
  bettingCard: {
    address: BETTING_CONTRACT_ADDRESS,
    abi: BETTING_ABI,
  },
} as const

export default contracts

// Note: TAO is native on Bittensor - no token contract address needed

