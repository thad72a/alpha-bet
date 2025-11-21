'use client'

import { useMemo } from 'react'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Target, TrendingUp, TrendingDown, DollarSign, Trophy } from 'lucide-react'

interface YourPositionProps {
  market: any
  userShares?: { yesShares: bigint; noShares: bigint }
}

export function YourPosition({ market, userShares }: YourPositionProps) {
  const position = useMemo(() => {
    if (!userShares) return null

    const yesShares = Number(formatEther(userShares.yesShares))
    const noShares = Number(formatEther(userShares.noShares))

    if (yesShares === 0 && noShares === 0) return null

    const totalInvested = yesShares + noShares
    
    // Calculate potential payouts
    const totalPool = market.liquidity || 0
    const totalYesShares = Number(market.totalYesShares) || 0
    const totalNoShares = Number(market.totalNoShares) || 0
    
    const yesPayout = totalYesShares > 0 ? (yesShares / totalYesShares) * totalPool : 0
    const noPayout = totalNoShares > 0 ? (noShares / totalNoShares) * totalPool : 0
    
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
      strongerSide: yesShares > noShares ? 'yes' : noShares > yesShares ? 'no' : 'equal'
    }
  }, [userShares, market])

  if (!position) return null

  return (
    <Card className="premium-card">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Your Position</h3>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Position Summary */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Total Invested</span>
            <span className="text-white font-bold text-lg">{position.totalInvested.toFixed(4)} TAO</span>
          </div>
          
          {market.resolved ? (
            /* Resolved - Show Final Outcome */
            <div className={`p-3 rounded-lg ${
              (market.outcome && position.yesShares > position.noShares) || (!market.outcome && position.noShares > position.yesShares)
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/80 mb-1">
                    Market Resolved: <span className="font-bold">{market.outcome ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`text-lg font-bold ${
                    (market.outcome && position.yesShares > position.noShares) || (!market.outcome && position.noShares > position.yesShares)
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {(market.outcome && position.yesShares > position.noShares) || (!market.outcome && position.noShares > position.yesShares)
                      ? '✅ You Won!'
                      : '❌ You Lost'}
                  </div>
                </div>
                <Trophy className={`w-8 h-8 ${
                  (market.outcome && position.yesShares > position.noShares) || (!market.outcome && position.noShares > position.yesShares)
                    ? 'text-yellow-400'
                    : 'text-white/20'
                }`} />
              </div>
            </div>
          ) : (
            /* Active/Pending - Show Potential Winnings */
            <>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Max Potential Payout</span>
                <span className="text-white font-bold text-lg">{position.maxPayout.toFixed(4)} TAO</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-white/60 text-sm">Potential Profit</span>
                <span className={`font-bold text-lg ${
                  position.potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {position.potentialProfit >= 0 ? '+' : ''}{position.potentialProfit.toFixed(4)} TAO
                  <span className="text-xs ml-1">
                    ({((position.potentialProfit / position.totalInvested) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Position Breakdown */}
        <div className="space-y-3">
          {/* YES Position */}
          {position.hasYes && (
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">YES Position</span>
                </div>
                <span className="text-white font-bold">{position.yesShares.toFixed(4)} TAO</span>
              </div>
              {!market.resolved && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">If YES wins</span>
                  <span className="text-green-400 font-medium">
                    {position.yesPayout.toFixed(4)} TAO
                    <span className="text-xs ml-1">
                      (+{(position.yesPayout - position.totalInvested).toFixed(4)})
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* NO Position */}
          {position.hasNo && (
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-semibold">NO Position</span>
                </div>
                <span className="text-white font-bold">{position.noShares.toFixed(4)} TAO</span>
              </div>
              {!market.resolved && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">If NO wins</span>
                  <span className="text-red-400 font-medium">
                    {position.noPayout.toFixed(4)} TAO
                    <span className="text-xs ml-1">
                      (+{(position.noPayout - position.totalInvested).toFixed(4)})
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        {!market.resolved && (
          <div className="flex items-start space-x-2 p-3 bg-blue-500/10 rounded-lg">
            <DollarSign className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200">
              {position.strongerSide === 'equal' 
                ? 'You have equal positions on both sides. Your profit depends on which side wins.'
                : `Your stronger position is ${position.strongerSide.toUpperCase()}. Maximum profit if ${position.strongerSide.toUpperCase()} wins.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

