'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface MarketChartProps {
  marketId: number
}

export function MarketChart({ marketId }: MarketChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '6H' | '1D' | '1W' | '1M' | 'ALL'>('ALL')
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Generate mock chart data
    const generateData = () => {
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

    setChartData(generateData())
  }, [marketId, timeframe])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-white font-semibold">{payload[0].value}%</p>
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
          {(['1H', '6H', '1D', '1W', '1M', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                timeframe === tf
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
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
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
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

