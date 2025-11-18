'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useCard } from '@/lib/contract-hooks'
import { formatEther } from 'viem'
import { getVolumeHistory, CardVolumeSnapshot } from '@/lib/supabase'

interface MarketChartProps {
  marketId: number
  netuid?: number
}

export function MarketChart({ marketId, netuid }: MarketChartProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('24h')
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { card } = useCard(marketId)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Try to fetch real bet history data from Supabase
        const volumeHistory = await getVolumeHistory(marketId, timeframe)
        
        if (volumeHistory.length > 0) {
          // Use real data
          const formattedData = volumeHistory.map(snapshot => ({
            time: new Date(snapshot.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: timeframe === '24h' ? '2-digit' : undefined,
              minute: timeframe === '24h' ? '2-digit' : undefined
            }),
            yesValue: parseFloat(snapshot.yes_volume),
            noValue: parseFloat(snapshot.no_volume),
            timestamp: new Date(snapshot.timestamp).getTime()
          }))
          setChartData(formattedData)
        } else {
          // Fall back to mock data if no real data exists yet
          const mockData = generateVolumeGrowthData()
          setChartData(mockData)
        }
      } catch (error) {
        console.error('Error fetching volume data:', error)
        setChartData(generateVolumeGrowthData())
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [marketId, timeframe, card])

  // Generate betting volume growth data for YES and NO
  const generateVolumeGrowthData = () => {
    // Get current YES and NO volumes from card data
    const currentYesVolume = card ? Number(formatEther(card.totalYesShares)) : 500
    const currentNoVolume = card ? Number(formatEther(card.totalNoShares)) : 500
    
    // Determine number of data points based on timeframe
    let dataPoints = 24 // 24h default
    let intervalMs = 3600000 // 1 hour
    
    switch (timeframe) {
      case '7d':
        dataPoints = 28 // 4 data points per day
        intervalMs = 6 * 3600000 // 6 hours
        break
      case '30d':
        dataPoints = 30
        intervalMs = 24 * 3600000 // 1 day
        break
      case 'all':
        dataPoints = 50
        intervalMs = 24 * 3600000 // 1 day
        break
    }
    
    const data = []
    const now = Date.now()
    
    // Generate cumulative growth curves for YES and NO
    for (let i = dataPoints; i >= 0; i--) {
      const time = now - (i * intervalMs)
      const progress = 1 - (i / dataPoints) // 0 to 1
      
      // Create S-curves for realistic betting volume growth (slightly different for YES/NO)
      const sCurveYes = 1 / (1 + Math.exp(-10 * (progress - 0.5)))
      const sCurveNo = 1 / (1 + Math.exp(-9 * (progress - 0.55))) // Slightly different curve
      
      const yesValue = currentYesVolume * sCurveYes
      const noValue = currentNoVolume * sCurveNo
      
      // Add some random variance
      const yesVariance = yesValue * 0.05 * (Math.random() - 0.5)
      const noVariance = noValue * 0.05 * (Math.random() - 0.5)
      
      const finalYesValue = Math.max(0, yesValue + yesVariance)
      const finalNoValue = Math.max(0, noValue + noVariance)
      
      data.push({
        time: new Date(time).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: timeframe === '24h' ? '2-digit' : undefined,
          minute: timeframe === '24h' ? '2-digit' : undefined
        }),
        yesValue: parseFloat(finalYesValue.toFixed(2)),
        noValue: parseFloat(finalNoValue.toFixed(2)),
        timestamp: time
      })
    }
    
    return data
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-white/60 text-xs mb-2">{payload[0].payload.time}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-green-400 text-xs">YES:</span>
              <span className="text-white font-semibold">{payload[0]?.value?.toFixed(2) || '0'} TAO</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-red-400 text-xs">NO:</span>
              <span className="text-white font-semibold">{payload[1]?.value?.toFixed(2) || '0'} TAO</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-white">Betting Volume Growth</h3>
          <div className="flex space-x-1">
            {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {isLoading && (
          <div className="text-xs text-white/60">Loading...</div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#ffffff40"
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value, index) => {
                // Only show first, middle, and last labels
                if (index === 0 || index === chartData.length - 1 || index === Math.floor(chartData.length / 2)) {
                  return value
                }
                return ''
              }}
            />
            <YAxis 
              stroke="#ffffff40"
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                return value.toFixed(0)
              }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="yesValue"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorYes)"
              name="YES"
            />
            <Area
              type="monotone"
              dataKey="noValue"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#colorNo)"
              name="NO"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

