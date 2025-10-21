'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'

interface OrderBookProps {
  market: any
}

export function OrderBook({ market }: OrderBookProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeOutcome, setActiveOutcome] = useState<'yes' | 'no'>('yes')

  // Mock order book data
  const mockOrders = {
    yes: [
      { outcome: 'Yes', price: 114.0, amount: '$231,049 Vol.' },
      { outcome: 'Yes', price: 116.0, amount: '$261,049 Vol.' },
      { outcome: 'Yes', price: 118.0, amount: '$115,025 Vol.' },
      { outcome: 'Yes', price: 120.0, amount: '$112,025 Vol.' },
      { outcome: 'Yes', price: 122.0, amount: '$112,025 Vol.' },
    ],
    no: [
      { outcome: 'No', price: 124.0, amount: '$50,122 Vol.' },
      { outcome: 'No', price: 126.0, amount: '$87,526 Vol.' },
      { outcome: 'No', price: 128.0, amount: '$67,526 Vol.' },
      { outcome: 'No', price: 130.0, amount: '$73,981 Vol.' },
      { outcome: 'No', price: 132.0, amount: '$85,421 Vol.' },
    ]
  }

  const orders = activeOutcome === 'yes' ? mockOrders.yes : mockOrders.no

  return (
    <Card className="premium-card">
      <CardHeader>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-lg font-semibold text-white">Order Book</h3>
          <ChevronDown 
            className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Outcome Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveOutcome('yes')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeOutcome === 'yes'
                  ? 'btn-yes'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setActiveOutcome('no')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeOutcome === 'no'
                  ? 'btn-no'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              No
            </button>
          </div>

          {/* Order Book Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-xs text-white/60 font-medium pb-2 border-b border-white/10">
              <div>Outcome</div>
              <div className="text-right">Price</div>
              <div className="text-right">Result</div>
            </div>
            
            {orders.map((order, index) => (
              <div 
                key={index}
                className="grid grid-cols-3 gap-4 text-sm py-2 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${order.outcome === 'Yes' ? 'bg-white' : 'bg-white/40'}`}></div>
                  <span className="text-white">{order.outcome}</span>
                </div>
                <div className="text-right text-white font-medium">
                  {order.price.toLocaleString()}
                </div>
                <div className="text-right text-white/60">
                  {order.amount}
                </div>
              </div>
            ))}
          </div>

          {/* View More */}
          <button className="w-full py-2 text-sm text-white/60 hover:text-white transition-all">
            View resolved →
          </button>
        </CardContent>
      )}
    </Card>
  )
}

