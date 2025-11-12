/**
 * Contract Read Hooks
 * Hooks to fetch real data from the BettingCard contract on Bittensor EVM
 */

import { useContractRead, useContractReads } from 'wagmi'
import { BETTING_CONTRACT_ADDRESS, BETTING_ABI } from './contracts'
import { useMemo } from 'react'

export interface BettingCardData {
  id: number
  netuid: number
  bettedAlphaPrice: bigint
  timestamp: bigint
  creator: string
  totalYesShares: bigint
  totalNoShares: bigint
  totalLiquidity: bigint
  resolved: boolean
  outcome: boolean
  creationTime: bigint
  cardType: number // 0 = Binary, 1 = Multi
  optionNames: string[]
  winningOption: bigint
}

/**
 * Get the total number of betting cards
 */
export function useCardCount() {
  const { data, isLoading, isError } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getCardCount',
    watch: true, // Auto-refresh when new cards are created
  })

  return {
    count: data ? Number(data) : 0,
    isLoading,
    isError,
  }
}

/**
 * Get a single card by ID
 */
export function useCard(cardId: number) {
  const { data, isLoading, isError, refetch } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getCard',
    args: [BigInt(cardId)],
    enabled: cardId > 0,
    watch: true,
  })

  return {
    card: data as BettingCardData | undefined,
    isLoading,
    isError,
    refetch,
  }
}

/**
 * Get multiple cards by IDs
 */
export function useCards(cardIds: number[]) {
  const contracts = useMemo(() => {
    return cardIds.map((id) => ({
      address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
      abi: BETTING_ABI,
      functionName: 'getCard',
      args: [BigInt(id)],
    }))
  }, [cardIds])

  const { data, isLoading, isError } = useContractReads({
    contracts,
    watch: true,
  })

  const cards = useMemo(() => {
    if (!data) return []
    return data
      .map((result, index) => {
        if (result.status === 'success' && result.result) {
          return result.result as BettingCardData
        }
        return null
      })
      .filter((card): card is BettingCardData => card !== null)
  }, [data])

  return {
    cards,
    isLoading,
    isError,
  }
}

/**
 * Get all betting cards (fetches count first, then all cards)
 */
export function useAllCards() {
  const { count, isLoading: countLoading } = useCardCount()
  
  const cardIds = useMemo(() => {
    if (count === 0) return []
    // Generate array [1, 2, 3, ..., count]
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [count])

  const { cards, isLoading: cardsLoading, isError } = useCards(cardIds)

  return {
    cards,
    count,
    isLoading: countLoading || cardsLoading,
    isError,
  }
}

/**
 * Get user's shares for a specific card
 */
export function useUserShares(userAddress: string | undefined, cardId: number) {
  const { data, isLoading, isError, refetch } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getUserShares',
    args: userAddress && cardId > 0 ? [userAddress as `0x${string}`, BigInt(cardId)] : undefined,
    enabled: Boolean(userAddress && cardId > 0),
    watch: true,
  })

  return {
    shares: data as { yesShares: bigint; noShares: bigint } | undefined,
    isLoading,
    isError,
    refetch,
  }
}

/**
 * Get user's stake on a specific option (for multi-option cards)
 */
export function useUserOptionStake(
  userAddress: string | undefined,
  cardId: number,
  optionIndex: number
) {
  const { data, isLoading, isError, refetch } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getUserOptionStake',
    args:
      userAddress && cardId > 0
        ? [userAddress as `0x${string}`, BigInt(cardId), BigInt(optionIndex)]
        : undefined,
    enabled: Boolean(userAddress && cardId > 0),
    watch: true,
  })

  return {
    stake: data as bigint | undefined,
    isLoading,
    isError,
    refetch,
  }
}

/**
 * Get total stake for a specific option
 */
export function useOptionTotalStake(cardId: number, optionIndex: number) {
  const { data, isLoading, isError } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getOptionTotalStake',
    args: cardId > 0 ? [BigInt(cardId), BigInt(optionIndex)] : undefined,
    enabled: cardId > 0,
    watch: true,
  })

  return {
    totalStake: data as bigint | undefined,
    isLoading,
    isError,
  }
}

/**
 * Get option names for a multi-option card
 */
export function useOptionNames(cardId: number) {
  const { data, isLoading, isError } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getOptionNames',
    args: cardId > 0 ? [BigInt(cardId)] : undefined,
    enabled: cardId > 0,
  })

  return {
    optionNames: data as string[] | undefined,
    isLoading,
    isError,
  }
}

/**
 * Get platform fee info
 */
export function usePlatformFee() {
  const { data: fee } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'platformFee',
  })

  const { data: denominator } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'FEE_DENOMINATOR',
  })

  return {
    fee: fee as bigint | undefined,
    denominator: denominator as bigint | undefined,
    feePercentage:
      fee && denominator ? (Number(fee) / Number(denominator)) * 100 : 2.5,
  }
}

/**
 * Get accumulated platform fees
 */
export function useAccumulatedFees() {
  const { data, isLoading } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getAccumulatedFees',
    watch: true,
  })

  return {
    fees: data as bigint | undefined,
    isLoading,
  }
}

