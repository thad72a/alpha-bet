'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
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
  BarChart3,
  Send,
  Briefcase
} from 'lucide-react'
import { MarketChart } from '@/components/MarketChart'
import { TradingPanel } from '@/components/TradingPanel'
import { ResolutionPanel } from '@/components/ResolutionPanel'
import { YourPosition } from '@/components/YourPosition'
import { OrderBook } from '@/components/OrderBook'
import { useCard, useUserShares } from '@/lib/contract-hooks'
import { useSubnet } from '@/components/SubnetProvider'
import { generateMarketContext } from '@/lib/market-context-generator'
import { getComments, addComment, subscribeToComments, Comment } from '@/lib/supabase'
import { showSuccessToast, showErrorToast } from '@/lib/errorHandling'

export default function MarketDetail() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const cardId = parseInt(params.id as string)
  
  // Fetch real blockchain data
  const { card, isLoading: cardLoading, refetch: refetchCard } = useCard(cardId)
  const subnetData = useSubnet(card?.netuid || 0)
  const { shares: userShares, refetch: refetchShares } = useUserShares(address, cardId)
  
  // Local state
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showMarketContext, setShowMarketContext] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentSort, setCommentSort] = useState<'newest' | 'top'>('newest')
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [marketContextData, setMarketContextData] = useState<ReturnType<typeof generateMarketContext> | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration errors - only render wallet-dependent content after mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generate market context when data is available
  useEffect(() => {
    if (card && subnetData) {
      const context = generateMarketContext(card, subnetData)
      setMarketContextData(context)
    }
  }, [card, subnetData])

  // Sort comments based on selected sort mode
  const sortedComments = useMemo(() => {
    const sorted = [...comments]
    if (commentSort === 'newest') {
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      // 'top' - would need user stake data to sort properly
      // For now, just reverse sort by created_at as placeholder
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
  }, [comments, commentSort])

  // Fetch comments from Supabase
  useEffect(() => {
    if (cardId) {
      loadComments()
      
      // Subscribe to real-time comment updates
      const subscription = subscribeToComments(cardId, (newComment) => {
        setComments(prev => [newComment, ...prev])
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [cardId])

  const loadComments = async () => {
    const fetchedComments = await getComments(cardId)
    setComments(fetchedComments)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !address) return

    setIsSubmittingComment(true)
    try {
      const comment = await addComment(cardId, address, newComment.trim())
      if (comment) {
        showSuccessToast('Comment posted successfully!')
        setNewComment('')
        // Comment will be added via real-time subscription
      } else {
        showErrorToast(new Error('Failed to post comment'), 'Comment Error')
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to post comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Refetch data after bet or resolution action
  const handleDataRefresh = () => {
    refetchCard()
    refetchShares()
    loadComments() // Also reload comments as bet activity might generate new ones
  }

  // Calculate market stats
  const market = useMemo(() => {
    if (!card) return null

    const totalYes = Number(formatEther(card.totalYesShares))
    const totalNo = Number(formatEther(card.totalNoShares))
    const totalLiquidity = Number(formatEther(card.totalLiquidity))
    const totalShares = totalYes + totalNo
    const yesPercentage = totalShares > 0 ? (totalYes / totalShares) * 100 : 50
    const noPercentage = 100 - yesPercentage

    return {
      id: card.id,
      question: marketContextData?.question || `Market #${card.id}`,
      title: marketContextData?.title || 'Prediction Market',
      type: card.cardType === 0 ? 'binary' : 'multi',
      netuid: card.netuid,
      bettedAlphaPrice: Number(formatEther(card.bettedAlphaPrice)),
      currentAlphaPrice: subnetData?.price || 0,
      timestamp: Number(card.timestamp),
      creator: card.creator,
      totalYesShares: totalYes,        // BUG FIX: Use actual TAO amount, not percentage
      totalNoShares: totalNo,          // BUG FIX: Use actual TAO amount, not percentage
      yesPercentage: yesPercentage,    // ADD: Keep percentage for display
      noPercentage: noPercentage,      // ADD: Keep percentage for display
      totalLiquidity: totalLiquidity,
      volume: totalLiquidity, // Simplified - would need historical data for accurate volume
      resolved: card.resolved,
      outcome: card.outcome,
      creationTime: Number(card.creationTime),
      rules: marketContextData?.rules || 'Rules will be displayed once market context is loaded.',
      description: marketContextData?.description || 'Loading market description...',
      background: marketContextData?.background || '',
      totalTraders: 0, // Would need to track this separately
      liquidity: totalLiquidity,
      endDate: new Date(Number(card.timestamp) * 1000).toISOString(),
      optionNames: card.optionNames,
      cardType: card.cardType
    }
  }, [card, subnetData, marketContextData])

  // Calculate user's position
  const userPosition = useMemo(() => {
    if (!userShares) return null

    const yesAmount = Number(formatEther(userShares.yesShares))
    const noAmount = Number(formatEther(userShares.noShares))

    return {
      yes: yesAmount,
      no: noAmount,
      total: yesAmount + noAmount
    }
  }, [userShares])

  const loading = cardLoading

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

  // Calculate betted amounts instead of probabilities
  const yesBettedAmount = card ? Number(formatEther(card.totalYesShares)) : 0
  const noBettedAmount = card ? Number(formatEther(card.totalNoShares)) : 0
  const totalBetted = yesBettedAmount + noBettedAmount
  const yesPercentage = totalBetted > 0 ? ((yesBettedAmount / totalBetted) * 100).toFixed(0) : '50'
  const noPercentage = totalBetted > 0 ? ((noBettedAmount / totalBetted) * 100).toFixed(0) : '50'
  
  const formatBettedAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(4)
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
                  <span className="text-black font-bold text-xl">$</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text tracking-tight">PriceMarkets</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isMounted && isConnected && (
                <Button
                  onClick={() => router.push('/portfolio')}
                  className="btn-secondary"
                  size="sm"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Portfolio
                </Button>
              )}
              {isMounted && <ConnectButton />}
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

                {/* Outcome Display - Betted Amounts */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-medium">Yes</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{formatBettedAmount(yesBettedAmount)} TAO</div>
                        <div className="text-xs text-white/60">{yesPercentage}% of total</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${yesPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-medium">No</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{formatBettedAmount(noBettedAmount)} TAO</div>
                        <div className="text-xs text-white/60">{noPercentage}% of total</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-white/60 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${noPercentage}%` }}
                      ></div>
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
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowMarketContext(!showMarketContext)}>
                  <h3 className="text-lg font-semibold text-white">Market Context</h3>
                  <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showMarketContext ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
              {showMarketContext && marketContextData?.description && (
                <CardContent className="pt-0">
                  <div className="text-white/80 leading-relaxed whitespace-pre-line">
                    {marketContextData.description}
                  </div>
                  <p className="text-xs text-white/40 mt-4 italic">Context generated from blockchain and network data.</p>
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
                    <select 
                      value={commentSort}
                      onChange={(e) => setCommentSort(e.target.value as 'newest' | 'top')}
                      className="bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:border-white/40 focus:outline-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="top">Top Betters</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment Input */}
                {isConnected ? (
                  <div className="glass rounded-lg p-4">
                    <Input 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="bg-black/40 border-white/20 text-white placeholder:text-white/40 mb-3"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitComment()
                        }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">
                        Press Enter to post, Shift+Enter for new line
                      </span>
                      <Button 
                        className="btn-primary" 
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? (
                          <span className="flex items-center space-x-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Posting...</span>
                          </span>
                        ) : (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Post
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="glass rounded-lg p-4 text-center">
                    <p className="text-white/60 mb-3">Connect your wallet to comment</p>
                    {isMounted && <ConnectButton />}
                  </div>
                )}
                
                {/* Comments List */}
                {sortedComments.length > 0 ? (
                  <div className="space-y-3">
                    {sortedComments.map((comment) => {
                      const commentDate = new Date(comment.created_at)
                      const now = new Date()
                      const diffMs = now.getTime() - commentDate.getTime()
                      const diffMins = Math.floor(diffMs / 60000)
                      const diffHours = Math.floor(diffMs / 3600000)
                      const diffDays = Math.floor(diffMs / 86400000)
                      
                      let timeAgo = ''
                      if (diffMins < 1) timeAgo = 'just now'
                      else if (diffMins < 60) timeAgo = `${diffMins}m ago`
                      else if (diffHours < 24) timeAgo = `${diffHours}h ago`
                      else timeAgo = `${diffDays}d ago`

                      return (
                        <div key={comment.id} className="glass rounded-lg p-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-semibold">
                                {comment.user_address.slice(2, 4).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium text-sm truncate">
                                  {comment.user_address.slice(0, 6)}...{comment.user_address.slice(-4)}
                                </span>
                                <span className="text-white/40 text-xs flex-shrink-0">{timeAgo}</span>
                              </div>
                              <p className="text-white/80 text-sm leading-relaxed break-words">
                                {comment.text}
                              </p>
                              {(comment.likes ?? 0) > 0 && (
                                <div className="mt-2 text-xs text-white/40">
                                  ❤️ {comment.likes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/60">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-lg font-medium mb-1">No comments yet</p>
                    <p className="text-sm">Be the first to share your thoughts on this market!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trading/Resolution Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Show user's position if they have one */}
              {address && userShares && (
                Number(formatEther(userShares.yesShares)) > 0 || Number(formatEther(userShares.noShares)) > 0
              ) && (
                <YourPosition market={market} userShares={userShares} />
              )}
              
              {/* Show Resolution Panel if card is past deadline and not resolved */}
              {!market.resolved && Date.now() / 1000 > market.timestamp ? (
                <ResolutionPanel market={market} onResolutionSuccess={handleDataRefresh} />
              ) : (
                <TradingPanel market={market} onBetSuccess={handleDataRefresh} />
              )}
              
              {/* Always show TradingPanel but make it read-only if resolved */}
              {market.resolved && <TradingPanel market={market} onBetSuccess={handleDataRefresh} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

