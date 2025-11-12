'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BettingCardData } from '@/types/subnet'
import { formatTAO, formatTimestamp } from '@/lib/bittensor'
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
  card: BettingCardData
  onBet: (cardId: number, isYes: boolean, shares: number) => void
  userShares?: { yesShares: number; noShares: number }
}

export function BettingCard({ card }: BettingCardProps) {
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(false)
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

  // Calculate implied probabilities
  const totalLiquidity = card.totalYesShares + card.totalNoShares
  const yesProbability = totalLiquidity > 0 ? (card.totalYesShares / totalLiquidity) * 100 : 50
  const noProbability = 100 - yesProbability

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
      return `$${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`
    }
    return `$${volume}`
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
            {/* Card ID */}
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
          
          {/* Right side: Probability gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 mb-1">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-white"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${yesProbability}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">{yesProbability.toFixed(0)}%</div>
              <div className="text-white/60 text-xs">chance</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between p-6">
        {/* Main Betting Buttons */}
        <div className="flex space-x-4 mb-6" onClick={handleButtonClick}>
          <Button
            className="btn-yes flex-1 font-bold text-lg h-14 rounded-xl transition-all duration-200"
            disabled={!canBet}
          >
            Yes
          </Button>
          <Button
            className="btn-no flex-1 font-bold text-lg h-14 rounded-xl transition-all duration-200"
            disabled={!canBet}
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
            <span className="text-white/60 text-sm">{formatVolume(card.volume)} Vol.</span>
          </div>
          <div className="flex items-center space-x-3" onClick={handleButtonClick}>
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-2 text-white/40 hover:text-white/80"
              onClick={(e) => {
                e.stopPropagation()
                setIsBookmarked(!isBookmarked)
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
                setIsBookmarked(!isBookmarked)
              }}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-white/80' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}