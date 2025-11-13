'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useCard } from '@/lib/contract-hooks'
import { getPriceHistory, subscribeToPriceUpdates } from '@/lib/supabase'

interface MarketChartProps {
  marketId: number
  netuid?: number
}

export function MarketChart({ marketId, netuid }: MarketChartProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d')
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { card } = useCard(marketId)

  useEffect(() => {
    const fetchData = async () => {
      if (!card && !netuid) {
        // Generate fallback mock data if no real data available
        setChartData(generateFallbackData())
        setIsLoading(false)
        return
      }

      const subnet = netuid || card?.netuid
      if (!subnet) {
        setChartData(generateFallbackData())
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const priceHistory = await getPriceHistory(subnet, timeframe)
        
        if (priceHistory.length === 0) {
          // No data yet, use fallback
          setChartData(generateFallbackData())
        } else {
          // Format data for chart
          const formatted = priceHistory.map(item => ({
            time: new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: timeframe === '24h' ? '2-digit' : undefined,
              minute: timeframe === '24h' ? '2-digit' : undefined
            }),
            value: item.alpha_price,
            timestamp: new Date(item.timestamp).getTime()
          }))
          setChartData(formatted)
        }
      } catch (error) {
        console.error('Error fetching price history:', error)
        setChartData(generateFallbackData())
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time price updates
    if (card?.netuid || netuid) {
      const subnet = netuid || card?.netuid!
      const subscription = subscribeToPriceUpdates(subnet, (newPrice) => {
        setChartData(prev => [
          ...prev,
          {
            time: new Date(newPrice.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: timeframe === '24h' ? '2-digit' : undefined
            }),
            value: newPrice.alpha_price,
            timestamp: new Date(newPrice.timestamp).getTime()
          }
        ].slice(-100)) // Keep last 100 points
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [marketId, timeframe, card, netuid])

  // Fallback mock data generator (for when Supabase has no data yet)
  const generateFallbackData = () => {
    const dataPoints = 50
    const data = []
    const now = Date.now()
    
    for (let i = dataPoints; i >= 0; i--) {
      const time = now - (i * 3600000) // Hour intervals
      const baseValue = 50
      const randomWalk = (Math.random() - 0.5) * 10
      const value = Math.max(20, Math.min(80, baseValue + randomWalk + (Math.sin(i / 5) * 10)))
      
      data.push({
        time: new Date(time).toLocaleTimeString('en-US', { 
          month: 'short',
          day: 'numeric',
          hour: '2-digit' 
        }),
        value: parseFloat(value.toFixed(1)),
        timestamp: time
      })
    }
    
    return data
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-white font-semibold">{payload[0].value.toFixed(2)} TAO</p>
          <p className="text-white/60 text-xs">{payload[0].payload.time}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
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
        {isLoading && (
          <div className="text-xs text-white/60">Loading...</div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
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
              tickFormatter={(value) => `${value.toFixed(0)}`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

