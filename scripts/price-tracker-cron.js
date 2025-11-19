/**
 * Price Tracker Cron Job
 * 
 * This script fetches current alpha prices from the Bittensor network
 * and stores them in Supabase for historical chart data.
 * 
 * Setup:
 * 1. Install dependencies: npm install @supabase/supabase-js node-fetch
 * 2. Configure environment variables in .env.local
 * 3. Run manually: node scripts/price-tracker-cron.js
 * 4. Or setup as cron job (every 5 minutes):
 *    crontab -e, then add:
 *    "star-slash-5 star star star star cd /path/to/alpha-bet && node scripts/price-tracker-cron.js >> logs/price-tracker.log 2>&1"
 *    (replace "star-slash" with actual cron syntax)
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.pricemarkets.io'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials not found in environment variables')
  console.error('   Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Fetch all subnet summaries from backend
 */
async function fetchSubnetData() {
  try {
    const response = await fetch(`${BACKEND_URL}/subnets`)
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Error fetching subnet data:', error.message)
    return null
  }
}

/**
 * Store price history in Supabase
 */
async function storePriceHistory(netuid, alphaPrice) {
  try {
    const { error } = await supabase
      .from('price_history')
      .insert({
        netuid: netuid,
        alpha_price: alphaPrice,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error(`❌ Error storing price for subnet ${netuid}:`, error.message)
      return false
    }

    console.log(`✅ Stored price for subnet ${netuid}: ${alphaPrice} TAO`)
    return true
  } catch (error) {
    console.error(`❌ Exception storing price for subnet ${netuid}:`, error.message)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now()
  console.log(`\n🕒 [${new Date().toISOString()}] Starting price tracker...`)

  // Fetch subnet data from backend
  const subnets = await fetchSubnetData()

  if (!subnets) {
    console.error('❌ Failed to fetch subnet data. Exiting.')
    process.exit(1)
  }

  console.log(`📊 Found ${Object.keys(subnets).length} subnets`)

  // Store prices for each subnet
  let successCount = 0
  let failCount = 0

  for (const [netuid, subnetData] of Object.entries(subnets)) {
    if (subnetData.price && subnetData.price > 0) {
      const success = await storePriceHistory(parseInt(netuid), subnetData.price)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    } else {
      console.log(`⚠️  Skipping subnet ${netuid}: No valid price data`)
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\n✨ Price tracking complete!`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   ⏱️  Duration: ${duration}s`)
  console.log(`   🕒 Next run: ${new Date(Date.now() + 3600000).toLocaleTimeString()}\n`)
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

