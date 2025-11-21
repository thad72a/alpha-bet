'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, Target, Award, AlertCircle } from 'lucide-react'
import { useAllCards } from '@/lib/contract-hooks'
import { formatEther } from 'viem'
import { enrichCard } from '@/lib/card-helpers'
import { useSubnetSummaries } from '@/components/SubnetProvider'

export default function Portfolio() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch all cards and subnet data
  const { cards: blockchainCards, isLoading: cardsLoading } = useAllCards()
  const { summaries } = useSubnetSummaries()

  // Enrich cards with subnet data
  const enrichedCards = useMemo(() => {
    if (!blockchainCards || blockchainCards.length === 0) return []
    return blockchainCards.map((card) => {
      const subnetData = summaries[card.netuid] || null
      return enrichCard(card, subnetData)
    })
  }, [blockchainCards, summaries])

  // Filter cards where user has positions
  const userPositions = useMemo(() => {
    if (!address || !enrichedCards.length) return []
    
    return enrichedCards.filter(card => {
      // Check if user has any shares in this card
      const hasYesShares = card.userShares?.yesShares && Number(formatEther(card.userShares.yesShares)) > 0
      const hasNoShares = card.userShares?.noShares && Number(formatEther(card.userShares.noShares)) > 0
      return hasYesShares || hasNoShares
    })
  }, [enrichedCards, address])

  // Categorize positions
  const activePositions = useMemo(() => 
    userPositions.filter(card => card.isActive), 
    [userPositions]
  )
  
  const pendingPositions = useMemo(() => 
    userPositions.filter(card => card.isPendingResolution), 
    [userPositions]
  )
  
  const resolvedPositions = useMemo(() => 
    userPositions.filter(card => card.resolved), 
    [userPositions]
  )

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    let totalInvested = 0
    let potentialWinnings = 0
    let realizedPL = 0
    let wins = 0
    let losses = 0

    userPositions.forEach(card => {
      const yesShares = Number(formatEther(card.userShares?.yesShares || 0n))
      const noShares = Number(formatEther(card.userShares?.noShares || 0n))
      const invested = yesShares + noShares
      totalInvested += invested

      if (card.resolved) {
        // Calculate realized P&L
        const payout = card.outcome ? yesShares * 2 : noShares * 2 // Simplified
        const profit = payout - invested
        realizedPL += profit
        if (profit > 0) wins++
        else if (profit < 0) losses++
      } else {
        // Calculate potential winnings
        const totalPool = Number(formatEther(card.totalLiquidity || 0n))
        const yesPool = Number(formatEther(card.totalYesShares || 0n))
        const noPool = Number(formatEther(card.totalNoShares || 0n))
        
        const yesPayout = yesPool > 0 ? (yesShares / yesPool) * totalPool : 0
        const noPayout = noPool > 0 ? (noShares / noPool) * totalPool : 0
        potentialWinnings += Math.max(yesPayout, noPayout)
      }
    })

    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0

    return {
      totalInvested,
      potentialWinnings,
      unrealizedPL: potentialWinnings - totalInvested,
      realizedPL,
      wins,
      losses,
      winRate,
      totalPositions: userPositions.length
    }
  }, [userPositions])

  const renderPositionCard = (card: any) => {
    const yesShares = Number(formatEther(card.userShares?.yesShares || 0n))
    const noShares = Number(formatEther(card.userShares?.noShares || 0n))
    const totalInvested = yesShares + noShares
    
    const totalPool = Number(formatEther(card.totalLiquidity || 0n))
    const yesPool = Number(formatEther(card.totalYesShares || 0n))
    const noPool = Number(formatEther(card.totalNoShares || 0n))
    
    const yesPayout = yesPool > 0 ? (yesShares / yesPool) * totalPool : 0
    const noPayout = noPool > 0 ? (noShares / noPool) * totalPool : 0
    const maxPayout = Math.max(yesPayout, noPayout)
    const potentialProfit = maxPayout - totalInvested

    return (
      <Card key={card.id} className="premium-card hover:border-white/20 transition-all cursor-pointer" onClick={() => router.push(`/market/${card.id}`)}>
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
              <h3 className="text-lg font-bold text-white mb-2">{card.title || card.question}</h3>
              
              {/* User's Position */}
              <div className="flex items-center space-x-4 text-sm mb-3">
                {yesShares > 0 && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-white font-medium">{yesShares.toFixed(2)} YES</span>
                  </div>
                )}
                {noShares > 0 && (
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-white font-medium">{noShares.toFixed(2)} NO</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/60 mb-1">Invested</div>
              <div className="text-lg font-bold text-white">{totalInvested.toFixed(2)} TAO</div>
            </div>
            <div>
              <div className="text-xs text-white/60 mb-1">
                {card.resolved ? 'Final Payout' : 'Max Payout'}
              </div>
              <div className={`text-lg font-bold ${
                potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {maxPayout.toFixed(2)} TAO
                <span className="text-xs ml-1">
                  ({potentialProfit >= 0 ? '+' : ''}{potentialProfit.toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          {/* Resolved Outcome */}
          {card.resolved && (
            <div className={`mt-4 p-3 rounded-lg ${
              card.outcome 
                ? yesShares > noShares ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                : noShares > yesShares ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">
                  Resolved: <span className="font-bold">{card.outcome ? 'YES' : 'NO'}</span>
                </span>
                <span className={`text-sm font-bold ${
                  (card.outcome && yesShares > noShares) || (!card.outcome && noShares > yesShares)
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {(card.outcome && yesShares > noShares) || (!card.outcome && noShares > yesShares)
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

  if (!isMounted) {
    return null
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Card className="premium-card max-w-md">
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-white/60 mb-6">
              Connect your wallet to view your portfolio and track your positions.
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.02%3E%3Ccircle cx=30 cy=30 r=1/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Markets
              </Button>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">My Portfolio</h1>
          <p className="text-white/60">Track your positions and performance</p>
        </div>

        {cardsLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading your positions...</p>
          </div>
        ) : userPositions.length === 0 ? (
          <Card className="premium-card">
            <CardContent className="text-center py-16">
              <Target className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Positions Yet</h3>
              <p className="text-white/60 mb-6">
                Start betting on prediction markets to see your portfolio here.
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Browse Markets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Total Invested</span>
                    <DollarSign className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {portfolioStats.totalInvested.toFixed(2)} TAO
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Potential Value</span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {portfolioStats.potentialWinnings.toFixed(2)} TAO
                  </div>
                  <div className={`text-xs mt-1 ${
                    portfolioStats.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {portfolioStats.unrealizedPL >= 0 ? '+' : ''}{portfolioStats.unrealizedPL.toFixed(2)} TAO
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Win Rate</span>
                    <Award className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {portfolioStats.winRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    {portfolioStats.wins}W / {portfolioStats.losses}L
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Active Markets</span>
                    <Target className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {portfolioStats.totalPositions}
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    {activePositions.length} active
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Positions */}
            {activePositions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Active Positions ({activePositions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activePositions.map(renderPositionCard)}
                </div>
              </div>
            )}

            {/* Pending Resolution */}
            {pendingPositions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  Pending Resolution ({pendingPositions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingPositions.map(renderPositionCard)}
                </div>
              </div>
            )}

            {/* Resolved Positions */}
            {resolvedPositions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  Resolved ({resolvedPositions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resolvedPositions.map(renderPositionCard)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

