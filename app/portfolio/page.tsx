'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Target } from 'lucide-react'
import { useAllCards } from '@/lib/contract-hooks'
import { enrichCard } from '@/lib/card-helpers'
import { useSubnetSummaries } from '@/components/SubnetProvider'
import { PortfolioCard } from '@/components/PortfolioCard'

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

  // Categorize enriched cards for display
  const activeCards = useMemo(() => 
    enrichedCards.filter(card => card.isActive), 
    [enrichedCards]
  )
  
  const pendingCards = useMemo(() => 
    enrichedCards.filter(card => card.isPendingResolution), 
    [enrichedCards]
  )
  
  const resolvedCards = useMemo(() => 
    enrichedCards.filter(card => card.resolved), 
    [enrichedCards]
  )

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
          <p className="text-white/60">Track your positions and performance across all markets</p>
        </div>

        {cardsLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading your positions...</p>
          </div>
        ) : !address ? (
          <Card className="premium-card">
            <CardContent className="text-center py-16">
              <Target className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-white/60 mb-6">
                Connect your wallet to see your portfolio.
              </p>
            </CardContent>
          </Card>
        ) : enrichedCards.length === 0 ? (
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
            {/* Active Positions */}
            {activeCards.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Active Markets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeCards.map(card => (
                    <PortfolioCard key={card.id} card={card} userAddress={address!} />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Resolution */}
            {pendingCards.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  Pending Resolution
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingCards.map(card => (
                    <PortfolioCard key={card.id} card={card} userAddress={address!} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Positions */}
            {resolvedCards.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  Resolved
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resolvedCards.map(card => (
                    <PortfolioCard key={card.id} card={card} userAddress={address!} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

