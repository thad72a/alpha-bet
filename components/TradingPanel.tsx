'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface TradingPanelProps {
  market: any
}

export function TradingPanel({ market }: TradingPanelProps) {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState<string>('0')
  const [balance] = useState(0)

  const presetAmounts = [1, 20, 100]

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString())
  }

  const handleMaxAmount = () => {
    setAmount(balance.toString())
  }

  const yesProbability = ((market.totalYesShares / (market.totalYesShares + market.totalNoShares)) * 100).toFixed(0)
  const noProbability = (100 - parseFloat(yesProbability)).toFixed(0)

  const estimatedShares = amount ? (parseFloat(amount) / (selectedOutcome === 'yes' ? parseFloat(yesProbability) : parseFloat(noProbability)) * 100).toFixed(2) : '0'

  return (
    <Card className="premium-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2 w-full">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'buy'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sell'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Market</span>
          <button className="text-sm text-white/80 hover:text-white flex items-center space-x-1">
            <span>Polymarket</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outcome Selection */}
        <div>
          <label className="text-sm text-white/60 mb-2 block">Outcome</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedOutcome('yes')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedOutcome === 'yes'
                  ? 'btn-yes'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              Yes {yesProbability}%
            </button>
            <button
              onClick={() => setSelectedOutcome('no')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedOutcome === 'no'
                  ? 'btn-no'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              No {noProbability}%
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-white/60">Amount</label>
            <span className="text-sm text-white/60">Balance ${balance.toFixed(2)}</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="pl-7 bg-black/40 border-white/20 text-white text-lg placeholder:text-white/40 h-12"
            />
          </div>
          
          {/* Preset Amounts */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetAmount(preset)}
                className="glass hover:bg-white/10 py-2 rounded-lg text-sm text-white/80 hover:text-white transition-all"
              >
                +${preset}
              </button>
            ))}
            <button
              onClick={handleMaxAmount}
              className="glass hover:bg-white/10 py-2 rounded-lg text-sm text-white/80 hover:text-white transition-all"
            >
              Max
            </button>
          </div>
        </div>

        {/* Estimated Shares */}
        {parseFloat(amount) > 0 && (
          <div className="glass rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Avg price</span>
              <span className="text-white">${(parseFloat(amount) / parseFloat(estimatedShares)).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-white/60">Shares</span>
              <span className="text-white">{estimatedShares}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-white/60">Potential return</span>
              <span className="text-white font-medium">
                ${(parseFloat(estimatedShares) - parseFloat(amount)).toFixed(2)} 
                <span className="text-white/60 ml-1">
                  ({((parseFloat(estimatedShares) / parseFloat(amount) - 1) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <div className="pt-2">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button 
                  onClick={openConnectModal}
                  className="w-full btn-primary h-12 text-base font-semibold"
                >
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        ) : balance === 0 ? (
          <Button 
            className="w-full btn-secondary h-12 text-base font-semibold"
            disabled
          >
            Unavailable
          </Button>
        ) : (
          <Button 
            className="w-full btn-primary h-12 text-base font-semibold"
            disabled={!amount || parseFloat(amount) === 0 || parseFloat(amount) > balance}
          >
            {activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedOutcome === 'yes' ? 'Yes' : 'No'}
          </Button>
        )}

        {/* Terms */}
        <p className="text-xs text-white/40 text-center">
          By trading, you agree to the{' '}
          <a href="#" className="text-white/60 hover:text-white underline">
            Terms of Use
          </a>
        </p>

        {/* Market Stats */}
        <div className="glass rounded-lg p-4 space-y-3 mt-6">
          <h4 className="text-sm font-semibold text-white mb-3">All</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Volume</span>
              <span className="text-white">${(market.volume / 1000).toFixed(1)}K</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Liquidity</span>
              <span className="text-white">${(market.liquidity / 1000).toFixed(1)}K</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Expires</span>
              <span className="text-white">
                {new Date(market.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Related Markets */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Related</h4>
            <button className="text-xs text-white/60 hover:text-white">View all</button>
          </div>
          
          <div className="space-y-2">
            <div className="glass rounded-lg p-3 hover:bg-white/5 transition-all cursor-pointer">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">₿</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 line-clamp-2 mb-1">
                    Will Bitcoin hit $100k or $130k first?
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">53%</span>
                    <span className="text-xs text-white/60">100k</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-lg p-3 hover:bg-white/5 transition-all cursor-pointer">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">Ξ</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 line-clamp-2 mb-1">
                    Ethereum Price Target
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">40%</span>
                    <span className="text-xs text-white/60">Up</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-lg p-3 hover:bg-white/5 transition-all cursor-pointer">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-black/40 to-gray-800/20 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✕</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 line-clamp-2 mb-1">
                    XRP Price Target
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">40%</span>
                    <span className="text-xs text-white/60">Up</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

