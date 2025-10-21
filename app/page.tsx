'use client'

import { useState, useEffect } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubnetData, BettingCardData } from '@/types/subnet'
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
  Rocket
} from 'lucide-react'

// Contract configuration
import { BETTING_CONTRACT_ADDRESS, BETTING_ABI } from '@/lib/contracts'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [subnets, setSubnets] = useState<SubnetData[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null)

  // Fetch card count
  const { data: cardCount } = useContractRead({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'getCardCount',
  })

  // Fetch all cards
  useEffect(() => {
    const fetchCards = async () => {
      // Mock data for demonstration - unified theme
      const mockCards = [
        {
          id: 1,
          type: 'price-threshold' as const,
          netuid: 1,
          bettedAlphaPrice: 0.025,
          currentAlphaPrice: 0.0234,
          priceChange: 2.1,
          timestamp: Math.floor(Date.now() / 1000) + 3600 * 4,
          creator: '0x1234567890abcdef1234567890abcdef12345678',
          totalYesShares: 150,
          totalNoShares: 100,
          totalLiquidity: 250,
          resolved: false,
          outcome: false,
          creationTime: Math.floor(Date.now() / 1000) - 3600,
          volume: 33000,
          frequency: 'Weekly',
          question: 'Will ALPHA-1 be above 0.025 TAO by October 13?'
        },
        {
          id: 2,
          type: 'binary-event' as const,
          netuid: 2,
          currentAlphaPrice: 0.0187,
          priceChange: -1.5,
          timestamp: Math.floor(Date.now() / 1000) + 3600 * 2,
          creator: '0xabcdef1234567890abcdef1234567890abcdef12',
          totalYesShares: 80,
          totalNoShares: 120,
          totalLiquidity: 200,
          resolved: false,
          outcome: false,
          creationTime: Math.floor(Date.now() / 1000) - 1800,
          volume: 26000,
          frequency: 'Daily',
          question: 'Will Subnet 2 reach 100 validators by December 31?'
        },
        {
          id: 3,
          type: 'price-threshold' as const,
          netuid: 3,
          bettedAlphaPrice: 0.020,
          currentAlphaPrice: 0.0156,
          priceChange: 0.8,
          timestamp: Math.floor(Date.now() / 1000) + 3600 * 6,
          creator: '0x9876543210fedcba9876543210fedcba98765432',
          totalYesShares: 200,
          totalNoShares: 150,
          totalLiquidity: 350,
          resolved: false,
          outcome: false,
          creationTime: Math.floor(Date.now() / 1000) - 7200,
          volume: 93000,
          frequency: 'Weekly',
          question: 'Will ALPHA-3 reach 0.020 TAO by October 9?'
        },
        {
          id: 4,
          type: 'binary-event' as const,
          netuid: 4,
          currentAlphaPrice: 0.0123,
          priceChange: 3.2,
          timestamp: Math.floor(Date.now() / 1000) + 3600 * 8,
          creator: '0xfedcba0987654321fedcba0987654321fedcba09',
          totalYesShares: 120,
          totalNoShares: 180,
          totalLiquidity: 300,
          resolved: false,
          outcome: false,
          creationTime: Math.floor(Date.now() / 1000) - 3600,
          volume: 105000,
          frequency: 'Monthly',
          question: 'Will Subnet 4 launch token by December 31?'
        }
      ]
      setCards(mockCards)
    }

    const fetchSubnets = async () => {
      try {
        // Mock subnet data
        const mockSubnets = [
          {
            netuid: 1,
            name: 'Compute',
            alphaPrice: 0.0234,
            validatorCount: 64,
            minerCount: 1024,
            totalStake: 1000000,
            emissionRate: 0.1,
            lastUpdate: Date.now()
          },
          {
            netuid: 2,
            name: 'Storage',
            alphaPrice: 0.0187,
            validatorCount: 32,
            minerCount: 512,
            totalStake: 500000,
            emissionRate: 0.05,
            lastUpdate: Date.now()
          },
          {
            netuid: 3,
            name: 'AI',
            alphaPrice: 0.0156,
            validatorCount: 128,
            minerCount: 2048,
            totalStake: 2000000,
            emissionRate: 0.2,
            lastUpdate: Date.now()
          },
          {
            netuid: 4,
            name: 'Gaming',
            alphaPrice: 0.0123,
            validatorCount: 16,
            minerCount: 256,
            totalStake: 250000,
            emissionRate: 0.03,
            lastUpdate: Date.now()
          }
        ]
        setSubnets(mockSubnets)
      } catch (error) {
        console.error('Error fetching subnets:', error)
      }
    }

    fetchCards()
    fetchSubnets()
    setLoading(false)
  }, [cardCount])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-white/80">Loading AlphaBet...</p>
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
                  <span className="text-black font-bold text-xl">α</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text tracking-tight">AlphaBet</h1>
                  <span className="text-sm text-white/70 font-medium">Bittensor Subnet Price Predictions</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-white/60">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Live Markets</span>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Subnet Navigation Tabs */}
      <div className="relative z-10 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 overflow-x-auto py-4">
            <button
              onClick={() => setSelectedSubnet(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedSubnet === null 
                  ? 'status-active' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Trending
            </button>
            <button
              onClick={() => setSelectedSubnet(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedSubnet === null 
                  ? 'status-active' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Breaking
            </button>
            <button
              onClick={() => setSelectedSubnet(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedSubnet === null 
                  ? 'status-active' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              New
            </button>
            {subnets.map((subnet) => (
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
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 whitespace-nowrap">
              More
              <ArrowUpRight className="w-3 h-3 inline ml-1 rotate-90" />
            </button>
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
                  <p className="text-2xl font-bold text-white">{cards.length}</p>
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
            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium text-white">{cards.length} markets</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Market
              </Button>
            </div>
          </div>
          
          {cards.length === 0 ? (
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
                    <ConnectButton />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card, index) => (
                <div key={card.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <BettingCard card={card} onBet={() => {}} />
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
            setCards(prev => [card, ...prev])
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}
