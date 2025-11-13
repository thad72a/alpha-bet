/**
 * Supabase Client Configuration
 * 
 * Setup:
 * 1. Create project at https://supabase.com
 * 2. Get API URL and anon key from project settings
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=your-project-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase not configured. Comments and charts will not work.')
  console.warn('   Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Comment {
  id: string
  card_id: number
  user_address: string
  text: string
  created_at: string
  parent_id?: string | null
  likes?: number
}

export interface PriceHistory {
  id: string
  netuid: number
  alpha_price: number
  timestamp: string
}

export interface UserBetHistory {
  id: string
  card_id: number
  user_address: string
  bet_type: 'yes' | 'no' | 'option'
  option_index?: number
  amount: string // TAO amount as string (to preserve precision)
  timestamp: string
  tx_hash: string
}

// Comment Functions
export async function getComments(cardId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data || []
}

export async function addComment(
  cardId: number,
  userAddress: string,
  text: string,
  parentId?: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      card_id: cardId,
      user_address: userAddress,
      text: text,
      parent_id: parentId || null,
      created_at: new Date().toISOString(),
      likes: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return null
  }

  return data
}

export async function likeComment(commentId: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_comment_likes', {
    comment_id: commentId
  })

  if (error) {
    console.error('Error liking comment:', error)
    return false
  }

  return true
}

// Price History Functions
export async function getPriceHistory(
  netuid: number,
  timeRange: '24h' | '7d' | '30d' | 'all' = '7d'
): Promise<PriceHistory[]> {
  let query = supabase
    .from('price_history')
    .select('*')
    .eq('netuid', netuid)
    .order('timestamp', { ascending: true })

  // Filter by time range
  if (timeRange !== 'all') {
    const now = new Date()
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)
    query = query.gte('timestamp', startTime.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching price history:', error)
    return []
  }

  return data || []
}

export async function addPriceHistory(
  netuid: number,
  alphaPrice: number
): Promise<boolean> {
  const { error } = await supabase
    .from('price_history')
    .insert({
      netuid: netuid,
      alpha_price: alphaPrice,
      timestamp: new Date().toISOString()
    })

  if (error) {
    console.error('Error adding price history:', error)
    return false
  }

  return true
}

// Real-time Subscriptions
export function subscribeToComments(
  cardId: number,
  callback: (comment: Comment) => void
) {
  return supabase
    .channel(`comments:${cardId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `card_id=eq.${cardId}`
      },
      (payload) => {
        callback(payload.new as Comment)
      }
    )
    .subscribe()
}

export function subscribeToPriceUpdates(
  netuid: number,
  callback: (price: PriceHistory) => void
) {
  return supabase
    .channel(`prices:${netuid}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'price_history',
        filter: `netuid=eq.${netuid}`
      },
      (payload) => {
        callback(payload.new as PriceHistory)
      }
    )
    .subscribe()
}

// User Bet History (optional - for tracking user's betting activity)
export async function addBetHistory(
  cardId: number,
  userAddress: string,
  betType: 'yes' | 'no' | 'option',
  amount: string,
  txHash: string,
  optionIndex?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('user_bet_history')
    .insert({
      card_id: cardId,
      user_address: userAddress,
      bet_type: betType,
      option_index: optionIndex,
      amount: amount,
      tx_hash: txHash,
      timestamp: new Date().toISOString()
    })

  if (error) {
    console.error('Error adding bet history:', error)
    return false
  }

  return true
}

export async function getUserBetHistory(
  userAddress: string,
  cardId?: number
): Promise<UserBetHistory[]> {
  let query = supabase
    .from('user_bet_history')
    .select('*')
    .eq('user_address', userAddress)
    .order('timestamp', { ascending: false })

  if (cardId) {
    query = query.eq('card_id', cardId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bet history:', error)
    return []
  }

  return data || []
}

