/**
 * Betting Card Helpers
 * Utilities to combine blockchain card data with real Bittensor subnet data
 */

import { formatEther } from 'viem'
import { BettingCardData as BlockchainCardData } from './contract-hooks'
import { BackendSubnetSummary } from './backend'
import { BettingCardData, CardType } from '@/types/subnet'

export interface EnrichedBettingCard extends Omit<BettingCardData, 'currentAlphaPrice' | 'priceChange'> {
  // Blockchain data
  id: number
  netuid: number
  bettedAlphaPrice: number // in TAO
  timestamp: number // Unix timestamp
  creator: string
  totalYesShares: number // in TAO
  totalNoShares: number // in TAO
  totalLiquidity: number // in TAO
  resolved: boolean
  outcome: boolean
  creationTime: number
  volume: number
  question: string
  
  // Card type info
  type: CardType // Compatible with BettingCardData
  cardType: 'binary' | 'multi' // From blockchain
  optionNames: string[]
  winningOption: number
  frequency: string // For display
  
  // Derived/enriched data
  currentAlphaPrice: number // from Bittensor network (made non-null for compatibility)
  priceChange: number // % change
  timeRemaining: number // seconds until deadline
  isActive: boolean // not resolved and deadline not passed
  yesPercentage: number // % of total shares
  noPercentage: number // % of total shares
  subnetName: string | null
}

/**
 * Convert blockchain card data to enriched display format
 */
export function enrichCard(
  card: BlockchainCardData,
  subnetData: BackendSubnetSummary | null
): EnrichedBettingCard {
  const bettedAlphaPrice = parseFloat(formatEther(card.bettedAlphaPrice))
  const currentAlphaPrice = subnetData?.price || 0
  const totalYesShares = parseFloat(formatEther(card.totalYesShares))
  const totalNoShares = parseFloat(formatEther(card.totalNoShares))
  const totalShares = totalYesShares + totalNoShares
  
  // Calculate price change percentage
  let priceChange = 0
  if (currentAlphaPrice > 0 && bettedAlphaPrice > 0) {
    priceChange = ((currentAlphaPrice - bettedAlphaPrice) / bettedAlphaPrice) * 100
  }
  
  const now = Math.floor(Date.now() / 1000)
  const timestamp = Number(card.timestamp)
  const timeRemaining = Math.max(0, timestamp - now)
  const isActive = !card.resolved && timeRemaining > 0
  
  // Calculate share percentages
  const yesPercentage = totalShares > 0 ? (totalYesShares / totalShares) * 100 : 50
  const noPercentage = totalShares > 0 ? (totalNoShares / totalShares) * 100 : 50
  
  const volume = parseFloat(formatEther(card.totalLiquidity))
  
  // Determine card type for UI
  const cardTypeUI = card.cardType === 0 ? 'binary' : 'multi'
  const type: CardType = cardTypeUI === 'binary' ? 'price-threshold' : 'binary-event'
  
  // Determine frequency based on time remaining
  const daysRemaining = timeRemaining / 86400
  let frequency = 'Daily'
  if (daysRemaining > 30) frequency = 'Monthly'
  else if (daysRemaining > 7) frequency = 'Weekly'
  
  // Generate question based on card type
  let question: string
  if (card.cardType === 0) {
    // Binary card
    question = `Will Subnet ${card.netuid} alpha reach ${bettedAlphaPrice.toFixed(4)} TAO by ${formatDeadline(timestamp)}?`
  } else {
    // Multi-option card
    question = `Subnet ${card.netuid} outcome by ${formatDeadline(timestamp)}`
  }
  
  return {
    id: Number(card.id),
    type,
    netuid: Number(card.netuid),
    bettedAlphaPrice,
    timestamp,
    creator: card.creator,
    totalYesShares,
    totalNoShares,
    totalLiquidity: volume,
    resolved: card.resolved,
    outcome: card.outcome,
    creationTime: Number(card.creationTime),
    cardType: cardTypeUI,
    optionNames: card.optionNames || [],
    winningOption: Number(card.winningOption),
    frequency,
    currentAlphaPrice,
    priceChange,
    timeRemaining,
    isActive,
    yesPercentage,
    noPercentage,
    volume,
    subnetName: subnetData?.subnet_name || null,
    question,
  }
}

/**
 * Format deadline timestamp to human-readable date
 */
export function formatDeadline(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  
  // If same year, don't show year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Ended'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Calculate win payout for a user
 */
export function calculatePayout(
  userYesShares: number,
  userNoShares: number,
  card: EnrichedBettingCard
): { yesWin: number; noWin: number } {
  let yesWin = 0
  let noWin = 0
  
  if (card.resolved) {
    if (card.outcome && card.totalYesShares > 0) {
      // YES won
      yesWin = (userYesShares / card.totalYesShares) * card.totalLiquidity
    } else if (!card.outcome && card.totalNoShares > 0) {
      // NO won
      noWin = (userNoShares / card.totalNoShares) * card.totalLiquidity
    }
  } else {
    // Not resolved yet - show potential payouts
    if (card.totalYesShares > 0) {
      yesWin = (userYesShares / card.totalYesShares) * card.totalLiquidity
    }
    if (card.totalNoShares > 0) {
      noWin = (userNoShares / card.totalNoShares) * card.totalLiquidity
    }
  }
  
  return { yesWin, noWin }
}

/**
 * Filter cards by status
 */
export function filterCards(
  cards: EnrichedBettingCard[],
  filter: 'all' | 'active' | 'resolved'
): EnrichedBettingCard[] {
  switch (filter) {
    case 'active':
      return cards.filter((card) => card.isActive)
    case 'resolved':
      return cards.filter((card) => card.resolved)
    default:
      return cards
  }
}

/**
 * Sort cards
 */
export function sortCards(
  cards: EnrichedBettingCard[],
  sortBy: 'volume' | 'deadline' | 'newest' | 'oldest'
): EnrichedBettingCard[] {
  const sorted = [...cards]
  
  switch (sortBy) {
    case 'volume':
      return sorted.sort((a, b) => b.volume - a.volume)
    case 'deadline':
      return sorted.sort((a, b) => a.timeRemaining - b.timeRemaining)
    case 'newest':
      return sorted.sort((a, b) => b.creationTime - a.creationTime)
    case 'oldest':
      return sorted.sort((a, b) => a.creationTime - b.creationTime)
    default:
      return sorted
  }
}

/**
 * Get card status badge info
 */
export function getCardStatus(card: EnrichedBettingCard): {
  label: string
  color: string
} {
  if (card.resolved) {
    return {
      label: card.outcome ? 'Resolved: YES' : 'Resolved: NO',
      color: card.outcome ? 'text-green-400' : 'text-red-400',
    }
  }
  
  if (card.timeRemaining <= 0) {
    return {
      label: 'Awaiting Resolution',
      color: 'text-yellow-400',
    }
  }
  
  return {
    label: 'Active',
    color: 'text-blue-400',
  }
}

/**
 * Format TAO amount
 */
export function formatTAO(amount: number, decimals: number = 4): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`
  } else {
    return amount.toFixed(decimals)
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

