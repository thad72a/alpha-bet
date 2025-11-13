/**
 * Market Context Generator
 * Generates human-readable descriptions for prediction markets
 * based on card data and subnet information
 */

import { BettingCardData as BlockchainCardData } from './contract-hooks'
import { BackendSubnetSummary } from './SubnetProvider'
import { formatEther } from 'viem'

interface MarketContext {
  title: string
  question: string
  description: string
  rules: string
  background: string
}

/**
 * Generate a complete market context from blockchain data and subnet info
 */
export function generateMarketContext(
  card: BlockchainCardData,
  subnetData: BackendSubnetSummary | null
): MarketContext {
  const isBinary = card.cardType === 0
  const isMulti = card.cardType === 1

  if (isBinary) {
    return generateBinaryMarketContext(card, subnetData)
  } else if (isMulti) {
    return generateMultiMarketContext(card, subnetData)
  }

  return {
    title: 'Prediction Market',
    question: 'Market details unavailable',
    description: 'This market is currently being set up.',
    rules: 'Rules will be available soon.',
    background: 'Background information is being generated.'
  }
}

/**
 * Generate context for binary (Yes/No) markets
 */
function generateBinaryMarketContext(
  card: BlockchainCardData,
  subnetData: BackendSubnetSummary | null
): MarketContext {
  const subnetName = subnetData?.subnet_name || `Subnet ${card.netuid}`
  const currentPrice = subnetData?.price || 0
  const targetPrice = Number(formatEther(card.bettedAlphaPrice))
  const deadline = new Date(Number(card.timestamp) * 1000)
  const validators = subnetData?.n || 0
  const emission = subnetData?.tao_in_emission || 0

  // Determine if it's a price increase or decrease prediction
  const isIncreaseMarket = targetPrice > currentPrice

  // Generate question
  const question = `Will ${subnetName} Alpha price reach ${formatPrice(targetPrice)} TAO before ${formatDate(deadline)}?`

  // Generate title
  const title = `${subnetName}: ${isIncreaseMarket ? '📈' : '📉'} ${formatPrice(targetPrice)} TAO by ${deadline.toLocaleDateString()}`

  // Generate description
  const priceDiff = Math.abs(targetPrice - currentPrice)
  const percentChange = currentPrice > 0 ? (priceDiff / currentPrice * 100) : 0
  const changeDirection = isIncreaseMarket ? 'increase' : 'decrease'

  const description = `This market predicts whether the Alpha price of ${subnetName} will ${changeDirection} from its current level of ${formatPrice(currentPrice)} TAO to ${formatPrice(targetPrice)} TAO (a ${percentChange.toFixed(1)}% ${changeDirection}) before the deadline on ${formatDate(deadline)}.

**Current Market Status:**
- Current Alpha Price: ${formatPrice(currentPrice)} TAO
- Target Alpha Price: ${formatPrice(targetPrice)} TAO
- Price ${isIncreaseMarket ? 'Needs to Gain' : 'Could Drop'}: ${formatPrice(priceDiff)} TAO (${percentChange.toFixed(1)}%)
- Active Validators: ${validators}
- Daily TAO Emission: ${emission.toFixed(2)} TAO

**About ${subnetName}:**
${generateSubnetBackground(card.netuid, subnetData)}

**Market Dynamics:**
The Alpha price represents the value of this subnet's token in the Bittensor ecosystem. Price movements are influenced by validator participation, network performance, token burns, and overall demand for the subnet's services.`

  // Generate rules
  const rules = `**Resolution Criteria:**

This market will immediately resolve to **"YES"** if:
- The Alpha price of ${subnetName} reaches or exceeds ${formatPrice(targetPrice)} TAO at any point before ${formatDate(deadline)} 23:59 UTC
- The price is verified through the Bittensor blockchain oracle

This market will resolve to **"NO"** if:
- The deadline of ${formatDate(deadline)} 23:59 UTC passes without the Alpha price reaching ${formatPrice(targetPrice)} TAO
- All timestamps are based on blockchain time

**Settlement:**
- Market resolves within 24 hours of the triggering event or deadline
- Winners can claim their winnings immediately after resolution
- All payouts are in native TAO tokens
- 2.5% platform fee is deducted from the pool`

  // Generate background
  const background = `**What is Alpha Price?**
Alpha price represents the current market value of a subnet's token in TAO. It reflects the subnet's performance, utility, and demand within the Bittensor network.

**Price Factors:**
- Validator participation and staking
- Network performance and uptime
- Token supply dynamics (burns/emissions)
- Market demand for subnet services
- Overall Bittensor ecosystem health

**Historical Context:**
${generateHistoricalContext(currentPrice, targetPrice, isIncreaseMarket)}

**Trading Tips:**
- Monitor validator count changes (currently ${validators} validators)
- Track daily emission rates (currently ${emission.toFixed(2)} TAO/day)
- Watch for network upgrades or announcements
- Consider broader Bittensor market trends`

  return {
    title,
    question,
    description,
    rules,
    background
  }
}

/**
 * Generate context for multi-option markets
 */
function generateMultiMarketContext(
  card: BlockchainCardData,
  subnetData: BackendSubnetSummary | null
): MarketContext {
  const subnetName = subnetData?.subnet_name || `Subnet ${card.netuid}`
  const deadline = new Date(Number(card.timestamp) * 1000)
  const optionNames = card.optionNames || []

  const question = `Which outcome will occur for ${subnetName} by ${formatDate(deadline)}?`
  
  const title = `${subnetName} Multi-Option Prediction`

  const description = `This is a multi-option prediction market for ${subnetName}. Participants can bet on one of ${optionNames.length} possible outcomes.

**Available Options:**
${optionNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

**Market Resolution:**
Only ONE option will be selected as the winner when this market resolves on ${formatDate(deadline)}.

**About ${subnetName}:**
${generateSubnetBackground(card.netuid, subnetData)}`

  const rules = `**Resolution Criteria:**

This market will resolve to the option that accurately describes the outcome as verified through the Bittensor blockchain and network data.

**Options:**
${optionNames.map((name, i) => `- **Option ${i + 1}**: ${name}`).join('\n')}

**Settlement:**
- Market resolves on or shortly after ${formatDate(deadline)}
- Only ONE option will be selected as the winner
- Winners split the entire pool proportionally to their stake
- 2.5% platform fee is deducted from the pool
- Payouts are in native TAO tokens`

  const background = `**Multi-Option Market Mechanics:**

Unlike binary (Yes/No) markets, multi-option markets allow you to bet on specific outcomes from multiple possibilities.

**How It Works:**
1. Choose one option you believe will occur
2. Place your bet in TAO
3. Your payout depends on:
   - How much you bet
   - How much others bet on your option
   - The total pool size

**Potential Returns:**
If your option has lower probability (less money bet on it), your potential returns are higher. If everyone bets on one option, returns are lower but more certain.

**Strategy:**
- Analyze each option's likelihood
- Consider the current probability distribution
- Look for undervalued options
- Diversify across multiple markets (but one option per market)`

  return {
    title,
    question,
    description,
    rules,
    background
  }
}

/**
 * Generate subnet-specific background information
 */
function generateSubnetBackground(netuid: number, subnetData: BackendSubnetSummary | null): string {
  const subnetName = subnetData?.subnet_name || `Subnet ${netuid}`
  
  // Known subnet descriptions
  const subnetDescriptions: Record<number, string> = {
    1: 'Text Prompting is the primary text generation subnet in Bittensor, focused on creating high-quality AI-generated text responses. It\'s one of the oldest and most established subnets.',
    2: 'Machine Translation provides real-time translation services across multiple languages using decentralized AI models.',
    3: 'Data Universe focuses on decentralized data storage and retrieval, creating a distributed knowledge graph.',
    18: 'Cortex.t is focused on advanced AI model training and fine-tuning in the Bittensor ecosystem.',
    19: 'Vision subnet specializes in image generation, recognition, and computer vision tasks.',
    21: 'Storage subnet provides decentralized file storage solutions on the Bittensor network.',
  }

  const description = subnetDescriptions[netuid] || `${subnetName} is a specialized subnet in the Bittensor network, contributing to the decentralized AI ecosystem.`

  return `${description}

**Network Stats:**
- Subnet ID: ${netuid}
- Active Validators: ${subnetData?.n || 'N/A'}
- Daily Emission: ${subnetData?.tao_in_emission?.toFixed(2) || '0'} TAO
- Current Alpha: ${subnetData?.price?.toFixed(2) || '0'} TAO`
}

/**
 * Generate historical context for price movements
 */
function generateHistoricalContext(currentPrice: number, targetPrice: number, isIncrease: boolean): string {
  const priceGap = Math.abs(targetPrice - currentPrice)
  const percentChange = currentPrice > 0 ? (priceGap / currentPrice * 100) : 0

  if (percentChange < 10) {
    return `The target price represents a modest ${percentChange.toFixed(1)}% movement, suggesting this is a short-term prediction based on current market conditions.`
  } else if (percentChange < 50) {
    return `The ${percentChange.toFixed(1)}% price movement indicates moderate volatility expectations. Historical data shows similar moves occur during subnet upgrades or significant network events.`
  } else {
    return `The target represents a significant ${percentChange.toFixed(1)}% price ${isIncrease ? 'increase' : 'decrease'}. Such large movements typically require major changes in subnet adoption, validator behavior, or broader market sentiment.`
  }
}

/**
 * Format price with appropriate precision
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

/**
 * Generate question from card data (simple version for card display)
 */
export function generateSimpleQuestion(
  card: BlockchainCardData,
  subnetName?: string
): string {
  const subnet = subnetName || `Subnet ${card.netuid}`
  const targetPrice = Number(formatEther(card.bettedAlphaPrice))
  const deadline = new Date(Number(card.timestamp) * 1000)

  if (card.cardType === 0) {
    // Binary market
    return `Will ${subnet} Alpha reach ${formatPrice(targetPrice)} TAO by ${deadline.toLocaleDateString()}?`
  } else {
    // Multi-option market
    return `${subnet} Outcome Prediction - ${deadline.toLocaleDateString()}`
  }
}

