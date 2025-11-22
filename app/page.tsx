'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubnetData } from '@/types/subnet'
import { BettingCard } from '@/components/BettingCard'
import { CreateCardModal } from '@/components/CreateCardModal'
import { 
  Search, 
  Filter, 
  Zap, 
  Globe, 
  BarChart3, 
  DollarSign, 
  Users, 
  Activity, 
  TrendingUp, 
  ArrowUpRight,
  Target,
  Rocket,
  Briefcase
} from 'lucide-react'

// Contract configuration
import { useSubnetSummaries } from '@/components/SubnetProvider'
import { useAllCards } from '@/lib/contract-hooks'
import { enrichCard, filterCards, sortCards } from '@/lib/card-helpers'

export default function Home() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [subnets, setSubnets] = useState<SubnetData[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'trending' | 'breaking' | 'new'>('trending')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'resolved'>('active')
  const [sortBy, setSortBy] = useState<'volume' | 'deadline' | 'newest' | 'oldest'>('volume')
  const [isMounted, setIsMounted] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())

  // Fix hydration errors - only render wallet-dependent content after mounting
  useEffect(() => {
    setIsMounted(true)
    // Load bookmarks from localStorage
    const saved = localStorage.getItem('bookmarked_cards')
    if (saved) {
      try {
        setBookmarks(new Set(JSON.parse(saved)))
      } catch (e) {
        console.error('Error loading bookmarks:', e)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreDropdown) {
        setShowMoreDropdown(false)
      }
    }
    
    if (showMoreDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreDropdown])
  
  // Fetch real data from blockchain and Bittensor network
  const { summaries, lastUpdated } = useSubnetSummaries()
  const { cards: blockchainCards, count: cardCount, isLoading: cardsLoading } = useAllCards()

  // Enrich blockchain cards with subnet data
  const enrichedCards = useMemo(() => {
    if (!blockchainCards || blockchainCards.length === 0) return []
    
    return blockchainCards.map((card) => {
      const subnetData = summaries[card.netuid] || null
      return enrichCard(card, subnetData)
    })
  }, [blockchainCards, summaries])

  // Toggle bookmark function
  const toggleBookmark = (cardId: number) => {
    const newBookmarks = new Set(bookmarks)
    if (newBookmarks.has(cardId)) {
      newBookmarks.delete(cardId)
    } else {
      newBookmarks.add(cardId)
    }
    setBookmarks(newBookmarks)
    localStorage.setItem('bookmarked_cards', JSON.stringify(Array.from(newBookmarks)))
  }

  // Apply filters and sorting
  const displayCards = useMemo(() => {
    let filtered = filterCards(enrichedCards, filterStatus)
    
    // Apply subnet filter if selected
    if (selectedSubnet !== null) {
      filtered = filtered.filter(card => card.netuid === selectedSubnet)
    } else {
      // Apply category filter
      const now = Date.now() / 1000
      switch (categoryFilter) {
        case 'breaking':
          // Cards close to deadline (<24h) or recently resolved
          filtered = filtered.filter(card => 
            (card.timeRemaining < 86400 && card.timeRemaining > 0) || 
            (card.resolved && (now - card.creationTime) < 86400)
          )
          break
        case 'new':
          // Recently created (<7 days)
          filtered = filtered.filter(card => (now - card.creationTime) < 604800)
          break
        case 'trending':
        default:
          // Keep all (sorted by volume by default)
          break
      }
    }
    
    const sorted = sortCards(filtered, sortBy)
    // Sort bookmarked cards first
    return sorted.sort((a, b) => {
      if (bookmarks.has(a.id) && !bookmarks.has(b.id)) return -1
      if (!bookmarks.has(a.id) && bookmarks.has(b.id)) return 1
      return 0
    })
  }, [enrichedCards, filterStatus, sortBy, bookmarks, selectedSubnet, categoryFilter])

  const loading = cardsLoading

  // Convert subnet summaries to SubnetData format for UI
  useEffect(() => {
    try {
      const list: SubnetData[] = Object.values(summaries).map((s) => ({
        netuid: s.netuid,
        name: s.subnet_name || `Subnet ${s.netuid}`,
        alphaPrice: typeof s.price === 'number' ? s.price : 0,
        validatorCount: typeof s.n === 'number' ? s.n : 0,
        minerCount: 0,
        totalStake: 0,
        emissionRate: typeof s.tao_in_emission === 'number' ? s.tao_in_emission : 0,
        lastUpdate: lastUpdated ?? Date.now(),
      }))
      setSubnets(list)
    } catch (error) {
      console.error('Error mapping subnets:', error)
    }
  }, [summaries, lastUpdated])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-white/80">Loading PriceMarkets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.02%3E%3Ccircle cx=30 cy=30 r=1/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      {/* Header */}
      <header className="relative z-10 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xl">$</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text tracking-tight">PriceMarkets</h1>
                  <span className="text-sm text-white/70 font-medium">Bittensor Subnet Price Predictions</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-white/60">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Live Markets</span>
              </div>
              {isMounted && <ConnectButton />}
            </div>
          </div>
        </div>
      </header>

      {/* Subnet Navigation Tabs */}
      <div className="relative z-40 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-4 overflow-visible">
            {/* Category filters */}
            <button
              onClick={() => {
                setCategoryFilter('trending')
                setSelectedSubnet(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                categoryFilter === 'trending' && selectedSubnet === null
                  ? 'status-active' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Trending
            </button>
            <button
              onClick={() => {
                setCategoryFilter('breaking')
                setSelectedSubnet(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                categoryFilter === 'breaking' && selectedSubnet === null
                  ? 'status-active' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Breaking
            </button>
            <button
              onClick={() => {
                setCategoryFilter('new')
                setSelectedSubnet(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                categoryFilter === 'new' && selectedSubnet === null
                  ? 'status-active' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              New
            </button>
            
            {/* Show first 3 subnets */}
            {subnets.slice(0, 3).map((subnet) => (
              <button
                key={subnet.netuid}
                onClick={() => setSelectedSubnet(subnet.netuid)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedSubnet === subnet.netuid 
                    ? 'status-active' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Subnet {subnet.netuid}
              </button>
            ))}
            
            {/* More dropdown */}
            {subnets.length > 3 && (
              <div className="relative z-50">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMoreDropdown(!showMoreDropdown)
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 whitespace-nowrap"
                >
                  More
                  <ArrowUpRight className={`w-3 h-3 inline ml-1 transition-transform ${showMoreDropdown ? 'rotate-180' : 'rotate-90'}`} />
                </button>
                
                {showMoreDropdown && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 w-96 bg-black border border-white/20 rounded-lg shadow-xl p-3 z-[100]"
                  >
                    <div className="grid grid-cols-4 gap-1.5">
                      {subnets.slice(3).map((subnet) => (
                        <button
                          key={subnet.netuid}
                          onClick={() => {
                            setSelectedSubnet(subnet.netuid)
                            setShowMoreDropdown(false)
                          }}
                          className={`p-2 rounded-lg text-xs font-medium text-center transition-all ${
                            selectedSubnet === subnet.netuid
                              ? 'bg-white/20 text-white border border-white/40'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="font-bold text-sm">Subnet {subnet.netuid}</div>
                          <div className="text-xs opacity-60 truncate">{subnet.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm text-white/80">Live Prediction Markets</span>
          </div>
          <h2 className="text-5xl font-bold gradient-text mb-6 tracking-tight">
            Predict the Future of Bittensor
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Trade on subnet alpha token prices with real-time data and smart contracts
          </p>
          {isConnected && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-8 py-4 text-lg rounded-xl"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Create Market
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{subnets.length}</p>
                  <p className="text-sm text-white/60">Active Subnets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{displayCards.length}</p>
                  <p className="text-sm text-white/60">Total Cards</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">$264K</p>
                  <p className="text-sm text-white/60">Total Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-white">{displayCards.length} markets</span>
              <div className="flex items-center space-x-2 glass rounded-lg p-1">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterStatus === 'active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterStatus === 'resolved'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <Input 
                  placeholder="Search markets..." 
                  className="pl-10 bg-black/40 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <select className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-white/40 focus:outline-none">
                <option value="ending-soon">Ending Soon</option>
                <option value="newest">Newest</option>
              </select>
              {isConnected && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create Market
                </Button>
              )}
            </div>
          </div>
          
          {displayCards.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">No Active Markets Yet</h4>
                <p className="text-white/60 text-lg mb-6 max-w-md mx-auto">
                  Be the first to create a prediction market and start earning rewards!
                </p>
                {isConnected ? (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary px-8 py-3 rounded-xl glow"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Create First Market
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/50">Connect your wallet to create markets</p>
                    {isMounted && <ConnectButton />}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCards.map((card, index) => (
                <div key={card.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <BettingCard 
                    card={card} 
                    onBet={() => {}} 
                    isBookmarked={bookmarks.has(card.id)}
                    onToggleBookmark={() => toggleBookmark(card.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Card Modal */}
      {showCreateModal && (
        <CreateCardModal
          subnets={subnets}
          onClose={() => setShowCreateModal(false)}
          onCardCreated={(card) => {
            // Card is now on-chain, it will appear automatically when blockchain data refreshes
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}
