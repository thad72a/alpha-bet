/**
 * Smart Contract Configuration
 * Deployed contract addresses and ABIs for the local Hardhat network
 */

import { BETTING_ABI, TAO_ABI } from './abis'

// Deployed contract addresses (local Hardhat network)
export const BETTING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BETTING_CONTRACT_ADDRESS as `0x${string}`
export const TAO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TAO_CONTRACT_ADDRESS as `0x${string}`

// Export ABIs
export { BETTING_ABI, TAO_ABI }

// Network configuration
export const HARDHAT_CHAIN_ID = 1337
export const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string

// Contract configuration object for easy import
export const contracts = {
  bettingCard: {
    address: BETTING_CONTRACT_ADDRESS,
    abi: BETTING_ABI,
  },
  taoToken: {
    address: TAO_CONTRACT_ADDRESS,
    abi: TAO_ABI,
  },
} as const

export default contracts

