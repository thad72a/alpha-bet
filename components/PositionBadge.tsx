'use client'

import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useUserShares } from '@/lib/contract-hooks'
import { Target } from 'lucide-react'

interface PositionBadgeProps {
  cardId: number
}

export function PositionBadge({ cardId }: PositionBadgeProps) {
  const { address } = useAccount()
  
  // Fetch user's shares for this card
  const { shares, isError, isLoading } = useUserShares(address, cardId)
  
  // Don't show anything if not connected
  if (!address) return null
  
  // Show loading state while fetching
  if (isLoading) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium border bg-white/5 border-white/10 flex items-center space-x-1 animate-pulse">
        <div className="w-3 h-3 bg-white/20 rounded-full"></div>
        <div className="w-16 h-3 bg-white/20 rounded"></div>
      </span>
    )
  }
  
  // Don't show if error or no shares data
  if (!shares || isError) return null
  
  try {
    const yesShares = Number(formatEther(shares.yesShares || 0n))
    const noShares = Number(formatEther(shares.noShares || 0n))
    
      const hasPosition = yesShares > 0 || noShares > 0
    
    if (!hasPosition) return null
    
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium border bg-purple-500/20 border-purple-500/50 text-purple-300 flex items-center space-x-1">
        <Target className="w-3 h-3" />
        <span>Your Position</span>
      </span>
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error rendering position badge:', error)
    }
    return null
  }
}

