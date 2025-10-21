export interface SubnetData {
  netuid: number
  name: string
  alphaPrice: number
  validatorCount: number
  minerCount: number
  totalStake: number
  emissionRate: number
  lastUpdate: number
}

export type CardType = 'price-threshold' | 'binary-event' | 'price-range' | 'date-threshold'

export interface BettingCardData {
  id: number
  type: CardType
  netuid: number
  bettedAlphaPrice?: number
  currentAlphaPrice: number
  priceChange: number
  timestamp: number
  creator: string
  totalYesShares: number
  totalNoShares: number
  totalLiquidity: number
  resolved: boolean
  outcome: boolean
  creationTime: number
  volume: number
  frequency: string
  question: string
  options?: Array<{
    label: string
    probability: number
    shares: number
  }>
}

export interface UserShares {
  yesShares: number
  noShares: number
}


