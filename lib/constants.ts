/**
 * Application-wide constants
 * Centralized configuration for timeouts, delays, and other magic numbers
 */

// ============================================================================
// Time Delays & Timeouts
// ============================================================================

/**
 * Delay after Supabase write to ensure data propagation before UI update
 */
export const SUPABASE_WRITE_DELAY = 500 // milliseconds

/**
 * Delay after resolution action success before refreshing data
 */
export const RESOLUTION_SUCCESS_DELAY = 2000 // milliseconds

/**
 * Delay before retrying a failed transaction
 */
export const TRANSACTION_RETRY_DELAY = 500 // milliseconds

// ============================================================================
// Data Fetching & Display Limits
// ============================================================================

/**
 * Maximum number of recent bets to display in the order book
 */
export const MAX_RECENT_BETS = 10

/**
 * Maximum number of comments to display before pagination
 */
export const MAX_COMMENTS_PER_PAGE = 50

// ============================================================================
// Cache Duration Settings (in milliseconds)
// ============================================================================

/**
 * Cache durations for contract reads
 * Shorter durations for frequently changing data, longer for static data
 */
export const CACHE_TIME = {
  /** Very short cache - for rapidly changing data like share prices */
  VERY_SHORT: 15_000, // 15 seconds
  
  /** Short cache - for frequently updated data like card stats */
  SHORT: 20_000, // 20 seconds
  
  /** Medium cache - for moderately changing data */
  MEDIUM: 30_000, // 30 seconds
  
  /** Long cache - for slowly changing data like user balances */
  LONG: 60_000, // 60 seconds
  
  /** Very long cache - for static or rarely changing data */
  VERY_LONG: 300_000, // 5 minutes
} as const

// ============================================================================
// RPC Configuration
// ============================================================================

/**
 * Global polling interval for blockchain data (in milliseconds)
 * Longer intervals reduce RPC load and rate limiting
 */
export const RPC_POLLING_INTERVAL = 30_000 // 30 seconds

/**
 * RPC request stall timeout (in milliseconds)
 */
export const RPC_STALL_TIMEOUT = 10_000 // 10 seconds

/**
 * Batch window for grouping multiple RPC calls
 */
export const RPC_BATCH_WAIT = 100 // milliseconds

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Number of cards to display per page on the home page
 */
export const CARDS_PER_PAGE = 12

/**
 * Debounce delay for search input
 */
export const SEARCH_DEBOUNCE_DELAY = 300 // milliseconds

