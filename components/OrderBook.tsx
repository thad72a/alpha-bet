'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { getUserBetHistory, UserBetHistory } from '@/lib/supabase'

interface OrderBookProps {
  market: any
}

export function OrderBook({ market }: OrderBookProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [recentBets, setRecentBets] = useState<UserBetHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentBets = async () => {
      setIsLoading(true)
      try {
        // Fetch recent bets for this card (no user filter = all bets)
        const bets = await getUserBetHistory('', market.id)
        console.log(`📊 Fetched ${bets.length} recent bets for card ${market.id}`)
        setRecentBets(bets.slice(0, 10)) // Show last 10 bets
      } catch (error) {
        console.error('Error fetching recent bets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (market?.id) {
      fetchRecentBets()
    }
  }, [market?.id])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const betTime = new Date(timestamp)
    const diffMs = now.getTime() - betTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Card className="premium-card">
      <CardHeader>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-lg font-semibold text-white">Recent Bets</h3>
          <ChevronDown 
            className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-white/60">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
              Loading bets...
            </div>
          ) : recentBets.length > 0 ? (
            <>
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 text-xs text-white/60 font-medium pb-2 border-b border-white/10">
                <div>Address</div>
                <div className="text-center">Side</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Time</div>
              </div>
              
              {/* Bets List */}
              <div className="space-y-1">
                {recentBets.map((bet) => (
                  <div 
                    key={bet.id}
                    className="grid grid-cols-4 gap-4 text-sm py-2 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-semibold">
                          {bet.user_address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white/80 text-xs font-mono">
                        {formatAddress(bet.user_address)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      {bet.bet_type === 'yes' ? (
                        <div className="flex items-center space-x-1 text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs font-semibold">YES</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-400">
                          <TrendingDown className="w-3 h-3" />
                          <span className="text-xs font-semibold">NO</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-white font-medium">
                      {parseFloat(bet.amount).toFixed(4)} TAO
                    </div>
                    
                    <div className="text-right text-white/60 text-xs">
                      {formatTimeAgo(bet.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-white/60">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No bets yet</p>
              <p className="text-xs mt-1">Be the first to place a bet!</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

