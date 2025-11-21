'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BettingCardData } from '@/types/subnet'
import { formatTAO, formatTimestamp } from '@/lib/bittensor'
import { BettingModal } from '@/components/BettingModal'
import { getCardStatus, EnrichedBettingCard } from '@/lib/card-helpers'
import { PositionBadge } from '@/components/PositionBadge'
import { 
  Copy, 
  Bookmark, 
  Gift,
  TrendingUp,
  Users,
  Activity,
  Clock,
  DollarSign
} from 'lucide-react'
import { useSubnet } from '@/components/SubnetProvider'

interface BettingCardProps {
  card: BettingCardData | EnrichedBettingCard
  onBet: (cardId: number, isYes: boolean, shares: number) => void
  userShares?: { yesShares: number; noShares: number }
  isBookmarked?: boolean
  onToggleBookmark?: () => void
}

export function BettingCard({ card, isBookmarked = false, onToggleBookmark }: BettingCardProps) {
  const router = useRouter()
  const [showBettingModal, setShowBettingModal] = useState(false)
  const [initialOutcome, setInitialOutcome] = useState<'yes' | 'no'>('yes')
  const [subnetName, setSubnetName] = useState<string | null>(null)
  const [subnetPrice, setSubnetPrice] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const subnetInfo = useSubnet(card.netuid)
  
  // Fix hydration: Only calculate time-based values on client
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const cardId = `#${card.id.toString().padStart(6, '0')}`
  
  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(cardId)
  }

  const handleCardClick = () => {
    router.push(`/market/${card.id}`)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }
  
  // Use isMounted to prevent hydration mismatch with Date.now()
  const isExpired = isMounted ? Date.now() / 1000 > card.timestamp : false
  const canBet = !card.resolved && !isExpired

  // Calculate betted amounts
  const yesBettedAmount = card.totalYesShares
  const noBettedAmount = card.totalNoShares
  const totalBetted = yesBettedAmount + noBettedAmount
  const yesPercentage = totalBetted > 0 ? (yesBettedAmount / totalBetted) * 100 : 50
  
  const formatBettedAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(4)
  }

  useEffect(() => {
    if (subnetInfo) {
      setSubnetName(subnetInfo.subnet_name || `Subnet ${card.netuid}`)
      setSubnetPrice(typeof subnetInfo.price === 'number' ? subnetInfo.price : null)
    }
  }, [subnetInfo, card.netuid])

  const getCardTypeIcon = () => {
    switch (card.type) {
      case 'price-threshold':
        return <TrendingUp className="w-4 h-4" />
      case 'binary-event':
        return <Users className="w-4 h-4" />
      case 'price-range':
        return <Activity className="w-4 h-4" />
      case 'date-threshold':
        return <Clock className="w-4 h-4" />
      default:
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M TAO`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K TAO`
    }
    return `${volume.toFixed(4)} TAO`
  }

  // Check if card is enriched, otherwise create minimal status
  const isEnriched = 'isPendingResolution' in card
  const status = isEnriched 
    ? getCardStatus(card as EnrichedBettingCard)
    : {
        label: card.resolved ? 'Resolved' : 'Active',
        color: 'text-white',
        bgColor: card.resolved ? 'bg-blue-500/20 border-blue-500/50' : 'bg-green-500/20 border-green-500/50'
      }

  return (
    <Card 
      className="premium-card transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/10 group h-80 flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          {/* Left side: ID + Question */}
          <div className="flex-1 pr-4">
            {/* Card ID + Status Badge + Position Indicator */}
            <div className="flex items-center space-x-2 mb-3 flex-wrap gap-y-1">
              <span className="text-white/60 text-sm font-mono">{cardId}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-1 h-6 w-6 text-white/40 hover:text-white/80"
                onClick={copyToClipboard}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
              <PositionBadge cardId={card.id} />
            </div>
            {/* Question */}
            <div className="text-white font-medium text-sm leading-tight">
              {card.question}
            </div>
            {/* Subnet info */}
            <div className="text-white/60 text-xs mt-2">
              {subnetName ? `${subnetName} (NetUID ${card.netuid})` : `Subnet ${card.netuid}`}
              {typeof subnetPrice === 'number' && (
                <span className="ml-2">• Price: {subnetPrice.toFixed(4)} TAO</span>
              )}
            </div>
          </div>
          
          {/* Right side: Betted amounts - Compact circular display */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              {/* Circular progress ring */}
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle
                  className="text-white/10"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  cx="18"
                  cy="18"
                  r="15.5"
                />
                {/* YES progress (green) */}
                <circle
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  cx="18"
                  cy="18"
                  r="15.5"
                  strokeDasharray={`${yesPercentage}, 100`}
                />
              </svg>
              {/* Center percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-white font-bold text-base leading-none">{yesPercentage.toFixed(0)}%</div>
                <div className="text-white/40 text-[9px] mt-0.5">YES</div>
              </div>
            </div>
            {/* Visual bar showing YES/NO split */}
            <div className="mt-2 w-16">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10">
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                />
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ width: `${100 - yesPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-white/40">
                <span>YES</span>
                <span>NO</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between p-6">
        {/* Main Betting Buttons */}
        <div className="flex space-x-4 mb-6">
          <Button
            className="btn-yes flex-1 font-bold text-lg h-14 rounded-xl transition-all duration-200"
            disabled={!canBet}
            onClick={(e) => {
              e.stopPropagation()
              setInitialOutcome('yes')
              setShowBettingModal(true)
            }}
          >
            Yes
          </Button>
          <Button
            className="btn-no flex-1 font-bold text-lg h-14 rounded-xl transition-all duration-200"
            disabled={!canBet}
            onClick={(e) => {
              e.stopPropagation()
              setInitialOutcome('no')
              setShowBettingModal(true)
            }}
          >
            No
          </Button>
        </div>

        {/* Footer with Volume and Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white/60 text-sm">LIVE</span>
            <span className="text-white/60 text-sm">•</span>
            <span className="text-white/60 text-sm">{formatVolume(card.volume)} Betted</span>
          </div>
          <div className="flex items-center space-x-3" onClick={handleButtonClick}>
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-2 text-white/40 hover:text-white/80"
              onClick={(e) => {
                e.stopPropagation()
                // Gift/reward functionality - placeholder
              }}
            >
              <Gift className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-2 text-white/40 hover:text-white/80"
              onClick={(e) => {
                e.stopPropagation()
                onToggleBookmark?.()
              }}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-yellow-400' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Betting Modal */}
      <BettingModal
        isOpen={showBettingModal}
        onClose={() => setShowBettingModal(false)}
        cardId={card.id}
        initialOutcome={initialOutcome}
        currentYesShares={BigInt(Math.floor(card.totalYesShares * 1e18))}
        currentNoShares={BigInt(Math.floor(card.totalNoShares * 1e18))}
        onSuccess={() => {
          // Optionally refresh card data here
          window.location.reload() // Simple refresh for now
        }}
      />
    </Card>
  )
}