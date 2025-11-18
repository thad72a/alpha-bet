'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BettingCardData } from '@/types/subnet'
import { formatTAO, formatTimestamp } from '@/lib/bittensor'
import { BettingModal } from '@/components/BettingModal'
import { getCardStatus, EnrichedBettingCard } from '@/lib/card-helpers'
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
  const subnetInfo = useSubnet(card.netuid)
  
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
  
  const isExpired = Date.now() / 1000 > card.timestamp
  const canBet = !card.resolved && !isExpired

  // Calculate betted amounts
  const yesBettedAmount = card.totalYesShares
  const noBettedAmount = card.totalNoShares
  const totalBetted = yesBettedAmount + noBettedAmount
  const yesPercentage = totalBetted > 0 ? (yesBettedAmount / totalBetted) * 100 : 50
  
  const formatBettedAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
    return amount.toFixed(0)
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
      return `${(volume / 1000000).toFixed(1)}M TAO`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K TAO`
    }
    return `${volume.toFixed(2)} TAO`
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
            {/* Card ID + Status Badge */}
            <div className="flex items-center space-x-2 mb-3">
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
            </div>
            {/* Question */}
            <div className="text-white font-medium text-sm leading-tight">
              {card.question}
            </div>
            {/* Subnet info */}
            <div className="text-white/60 text-xs mt-2">
              {subnetName ? `${subnetName} (NetUID ${card.netuid})` : `Subnet ${card.netuid}`}
              {typeof subnetPrice === 'number' && (
                <span className="ml-2">• Price: {subnetPrice} TAO</span>
              )}
            </div>
          </div>
          
          {/* Right side: Betted amounts */}
          <div className="flex flex-col items-end min-w-[100px]">
            <div className="glass rounded-lg p-2 mb-1 w-full">
              <div className="text-xs text-white/60 mb-0.5">YES</div>
              <div className="text-white font-bold text-sm">{formatBettedAmount(yesBettedAmount)} TAO</div>
              <div className="text-xs text-white/50">{yesPercentage.toFixed(0)}%</div>
            </div>
            <div className="glass rounded-lg p-2 w-full">
              <div className="text-xs text-white/60 mb-0.5">NO</div>
              <div className="text-white font-bold text-sm">{formatBettedAmount(noBettedAmount)} TAO</div>
              <div className="text-xs text-white/50">{(100 - yesPercentage).toFixed(0)}%</div>
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