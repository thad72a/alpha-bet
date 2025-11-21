'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatEther } from 'viem'
import { Card, CardContent } from '@/components/ui/card'
import { useUserShares } from '@/lib/contract-hooks'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { EnrichedBettingCard } from '@/lib/card-helpers'

interface PortfolioCardProps {
  card: EnrichedBettingCard
  userAddress: string
}

export function PortfolioCard({ card, userAddress }: PortfolioCardProps) {
  const router = useRouter()
  const { shares, isLoading } = useUserShares(userAddress, card.id)
  
  const position = useMemo(() => {
    if (!shares) return null
    
    const yesShares = Number(formatEther(shares.yesShares || 0n))
    const noShares = Number(formatEther(shares.noShares || 0n))
    
    if (yesShares === 0 && noShares === 0) return null
    
    const totalInvested = yesShares + noShares
    
    // Calculate potential payouts
    const totalPool = card.totalLiquidity
    const yesPool = card.totalYesShares
    const noPool = card.totalNoShares
    
    const yesPayout = yesPool > 0 ? (yesShares / yesPool) * totalPool : 0
    const noPayout = noPool > 0 ? (noShares / noPool) * totalPool : 0
    const maxPayout = Math.max(yesPayout, noPayout)
    const potentialProfit = maxPayout - totalInvested
    
    return {
      yesShares,
      noShares,
      totalInvested,
      yesPayout,
      noPayout,
      maxPayout,
      potentialProfit,
      hasYes: yesShares > 0,
      hasNo: noShares > 0,
    }
  }, [shares, card])
  
  // Don't render if no position
  if (isLoading) return null
  if (!position) return null
  
  return (
    <Card 
      className="premium-card hover:border-white/20 transition-all cursor-pointer" 
      onClick={() => router.push(`/market/${card.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                card.resolved 
                  ? 'bg-blue-500/20 text-blue-300'
                  : card.isPendingResolution
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {card.resolved ? 'Resolved' : card.isPendingResolution ? 'Pending' : 'Active'}
              </span>
              <span className="text-xs text-white/60">SN{card.netuid}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{card.question}</h3>
            
            {/* User's Position */}
            <div className="flex items-center space-x-4 text-sm mb-3">
              {position.hasYes && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">{position.yesShares.toFixed(2)} YES</span>
                </div>
              )}
              {position.hasNo && (
                <div className="flex items-center space-x-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-white font-medium">{position.noShares.toFixed(2)} NO</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-white/60 mb-1">Invested</div>
            <div className="text-lg font-bold text-white">{position.totalInvested.toFixed(2)} TAO</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">
              {card.resolved ? 'Final Payout' : 'Max Payout'}
            </div>
            <div className={`text-lg font-bold ${
              position.potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {position.maxPayout.toFixed(2)} TAO
              <span className="text-xs ml-1">
                ({position.potentialProfit >= 0 ? '+' : ''}{position.potentialProfit.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Resolved Outcome */}
        {card.resolved && (
          <div className={`mt-4 p-3 rounded-lg ${
            card.outcome 
              ? position.yesShares > position.noShares ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              : position.noShares > position.yesShares ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">
                Resolved: <span className="font-bold">{card.outcome ? 'YES' : 'NO'}</span>
              </span>
              <span className={`text-sm font-bold ${
                (card.outcome && position.yesShares > position.noShares) || (!card.outcome && position.noShares > position.yesShares)
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {(card.outcome && position.yesShares > position.noShares) || (!card.outcome && position.noShares > position.yesShares)
                  ? '✅ WON'
                  : '❌ LOST'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

