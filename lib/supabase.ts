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

// Use placeholder values if env vars not set (to avoid build errors)
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase not configured. Comments and charts will not work.')
  console.warn('   Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
}

export const supabase = createClient(url, key)
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

/**
 * Helper function to safely convert values to strings, handling BigInt
 * This prevents "TypeError: Do not know how to serialize a BigInt" errors
 */
export function safeStringify(value: any): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value, (key, val) => 
      typeof val === 'bigint' ? val.toString() : val
    )
  }
  return String(value)
}

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

export interface CardVolumeSnapshot {
  id: string
  card_id: number
  yes_volume: string // Cumulative YES volume in TAO
  no_volume: string // Cumulative NO volume in TAO
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
  // Ensure all values are safe for JSON serialization (handle BigInt)
  const safeData = {
    card_id: Number(cardId),
    user_address: String(userAddress),
    text: String(text),
    parent_id: parentId ? String(parentId) : null,
    created_at: new Date().toISOString(),
    likes: 0
  }
  
  const { data, error } = await supabase
    .from('comments')
    .insert(safeData)
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
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured - bet history not saved')
    return false
  }

  try {
    // Ensure all values are safe for JSON serialization (handle BigInt)
    const safeData = {
      card_id: Number(cardId),
      user_address: String(userAddress),
      bet_type: betType,
      option_index: optionIndex !== undefined ? Number(optionIndex) : null,
      amount: String(amount),
      tx_hash: String(txHash),
      timestamp: new Date().toISOString()
    }
    
    // Use upsert to handle duplicates gracefully
    // If tx_hash already exists, do nothing (ignore duplicate)
    const { error } = await supabase
      .from('user_bet_history')
      .upsert(safeData, { 
        onConflict: 'tx_hash',
        ignoreDuplicates: true 
      })

    if (error) {
      // Log error but don't fail if it's just a duplicate
      if (error.code === '23505') { // PostgreSQL unique violation code
        console.log('ℹ️ Bet already recorded (duplicate tx_hash):', txHash)
        return true // Return success since the bet is already recorded
      }
      console.error('Error adding bet history:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Exception in addBetHistory:', err)
    return false
  }
}

export async function getUserBetHistory(
  userAddress: string,
  cardId?: number
): Promise<UserBetHistory[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  let query = supabase
    .from('user_bet_history')
    .select('*')
    .order('timestamp', { ascending: false })

  // If userAddress is provided, filter by it
  if (userAddress) {
    query = query.eq('user_address', userAddress)
  }

  // If cardId is provided, filter by it
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

// Card Volume Snapshot Functions
export async function recordVolumeSnapshot(
  cardId: number,
  yesVolume: string,
  noVolume: string,
  txHash: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, skipping volume snapshot')
    return false
  }

  try {
    // Ensure all values are safe for JSON serialization (handle BigInt)
    const safeData = {
      card_id: Number(cardId),
      yes_volume: String(yesVolume),
      no_volume: String(noVolume),
      tx_hash: String(txHash),
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('card_volume_snapshots')
      .insert(safeData)

    if (error) {
      // If it's a duplicate, just log and return success
      if (error.code === '23505') {
        console.log('ℹ️ Volume snapshot already recorded for tx:', txHash)
        return true
      }
      console.error('Error recording volume snapshot:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Exception in recordVolumeSnapshot:', err)
    return false
  }
}

export async function getVolumeHistory(
  cardId: number,
  timeRange: '24h' | '7d' | '30d' | 'all' = '24h'
): Promise<CardVolumeSnapshot[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  let query = supabase
    .from('card_volume_snapshots')
    .select('*')
    .eq('card_id', cardId)
    .order('timestamp', { ascending: true })

  // Filter by time range
  if (timeRange !== 'all') {
    const now = new Date()
    let startTime: Date

    switch (timeRange) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(0)
    }

    query = query.gte('timestamp', startTime.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching volume history:', error)
    return []
  }

  return data || []
}

