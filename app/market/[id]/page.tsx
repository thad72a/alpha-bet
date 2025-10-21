'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  Bookmark, 
  Share2,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Activity,
  ChevronDown,
  MessageSquare,
  BarChart3
} from 'lucide-react'
import { MarketChart } from '@/components/MarketChart'
import { TradingPanel } from '@/components/TradingPanel'
import { OrderBook } from '@/components/OrderBook'

export default function MarketDetail() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [market, setMarket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [comments, setComments] = useState<any[]>([])
  const [marketContext, setMarketContext] = useState('')

  useEffect(() => {
    // Mock market data - in production, fetch from contract/API
    const mockMarket = {
      id: parseInt(params.id as string),
      question: 'Will Bitcoin dip below $100k before 2026?',
      type: 'price-threshold',
      netuid: 1,
      bettedAlphaPrice: 100000,
      currentAlphaPrice: 173553,
      timestamp: new Date('2025-12-31').getTime() / 1000,
      creator: '0x1234567890abcdef1234567890abcdef12345678',
      totalYesShares: 51,
      totalNoShares: 49,
      totalLiquidity: 1735532,
      volume: 1735532,
      resolved: false,
      outcome: false,
      creationTime: Date.now() / 1000 - 86400,
      rules: 'This market will immediately resolve to "Yes" if any Binance 1 minute candle for Bitcoin [BTC/USDT] between July 14, 2025, 14:00 and December 31, 2025, 23:59 UTC has a low price of $100,000 or below. Otherwise, this market will resolve to "No".',
      description: 'Over the past week, as of mid-October 2025, recent developments have painted a cautiously bullish picture for Bitcoin\'s price trajectory this month. Technical analyses suggest bullish momentum, with price targets around $238-$240, while current trading levels hover near $221-$234 after an 11.57% surge.',
      totalTraders: 605,
      liquidity: 1735532,
      endDate: new Date('2025-12-31').toISOString()
    }

    const mockComments = [
      {
        id: 1,
        user: 'omegasecretum',
        time: '12h ago',
        text: 'I am a boy from Venezuela who is going through a difficult situation, there is no future, support me with a donation and change'
      }
    ]

    setMarket(mockMarket)
    setComments(mockComments)
    setMarketContext(mockMarket.description)
    setLoading(false)
  }, [params.id])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-white/80">Loading market...</p>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-white/80">Market not found</p>
        </div>
      </div>
    )
  }

  const yesProbability = ((market.totalYesShares / (market.totalYesShares + market.totalNoShares)) * 100).toFixed(0)
  const noProbability = ((market.totalNoShares / (market.totalYesShares + market.totalNoShares)) * 100).toFixed(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
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
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xl">α</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text tracking-tight">AlphaBet</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Question & Actions */}
            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white/60 text-sm">Crypto</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">{market.question}</h1>
                    <div className="flex items-center space-x-4 text-sm text-white/60">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${(market.volume / 1000).toFixed(1)}K Vol.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Ends {new Date(market.timestamp * 1000).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{market.totalTraders} traders</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/60 hover:text-white"
                      onClick={copyLink}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/60 hover:text-white"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Outcome Display */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-medium">Yes</span>
                      <span className="text-2xl font-bold text-white">{yesProbability}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${yesProbability}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-white/60">
                      ${((market.totalYesShares / 1000) * 3.5).toFixed(0)}¢
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-medium">No</span>
                      <span className="text-2xl font-bold text-white">{noProbability}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-white/60 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${noProbability}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-white/60">
                      ${((market.totalNoShares / 1000) * 3.5).toFixed(0)}¢
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <MarketChart marketId={market.id} />
              </CardContent>
            </Card>

            {/* Order Book */}
            <OrderBook market={market} />

            {/* Market Context */}
            <Card className="premium-card">
              <CardHeader>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRules(!showRules)}>
                  <h3 className="text-lg font-semibold text-white">Market Context</h3>
                  <Button variant="ghost" size="sm" className="text-white/60">
                    Generate
                  </Button>
                </div>
              </CardHeader>
              {marketContext && (
                <CardContent className="pt-0">
                  <p className="text-white/80 leading-relaxed">{marketContext}</p>
                  <p className="text-xs text-white/40 mt-4 italic">Results are experimental.</p>
                </CardContent>
              )}
            </Card>

            {/* Rules */}
            <Card className="premium-card">
              <CardHeader>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRules(!showRules)}>
                  <h3 className="text-lg font-semibold text-white">Rules</h3>
                  <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showRules ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
              {showRules && (
                <CardContent className="pt-0">
                  <p className="text-white/80 leading-relaxed">{market.rules}</p>
                </CardContent>
              )}
            </Card>

            {/* Comments */}
            <Card className="premium-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Comments ({comments.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <select className="bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:border-white/40 focus:outline-none">
                      <option>Newest</option>
                      <option>Top Holders</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected && (
                  <div className="glass rounded-lg p-4">
                    <Input 
                      placeholder="Add a comment"
                      className="bg-black/40 border-white/20 text-white placeholder:text-white/40 mb-2"
                    />
                    <div className="flex justify-end">
                      <Button className="btn-primary" size="sm">Post</Button>
                    </div>
                  </div>
                )}
                
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="glass rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium text-sm">{comment.user}</span>
                            <span className="text-white/40 text-xs">{comment.time}</span>
                          </div>
                          <p className="text-white/80 text-sm">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TradingPanel market={market} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

