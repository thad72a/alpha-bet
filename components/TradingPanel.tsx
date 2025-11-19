'use client'

import { useState, useEffect, useMemo } from 'react'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { showErrorToast, showSuccessToast, showLoadingToast, dismissToast } from '@/lib/errorHandling'
import { BETTING_CONTRACT_ADDRESS, BETTING_ABI } from '@/lib/contracts'
import { addBetHistory, recordVolumeSnapshot } from '@/lib/supabase'
import { AlertCircle, TrendingUp, Info } from 'lucide-react'

interface TradingPanelProps {
  market: any
}

export function TradingPanel({ market }: TradingPanelProps) {
  const { address, isConnected } = useAccount()
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState<string>('')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if betting is disabled (market resolved or past deadline)
  const isBettingDisabled = market.resolved || (Date.now() / 1000 > market.timestamp)

  const presetAmounts = [1, 3, 5, 10]

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString())
  }

  // Get current shares from market (already in percentage format from market detail page)
  const currentYesProb = market.totalYesShares || 50
  const currentNoProb = market.totalNoShares || 50

  // Calculate total shares in wei for ROI calculation
  // Need to convert back from percentage to actual shares
  const totalLiquidityWei = useMemo(() => {
    try {
      return parseEther(market.totalLiquidity?.toString() || '0')
    } catch {
      return 0n
    }
  }, [market.totalLiquidity])

  const currentYesSharesWei = useMemo(() => {
    return (totalLiquidityWei * BigInt(Math.floor(currentYesProb))) / 100n
  }, [totalLiquidityWei, currentYesProb])

  const currentNoSharesWei = useMemo(() => {
    return (totalLiquidityWei * BigInt(Math.floor(currentNoProb))) / 100n
  }, [totalLiquidityWei, currentNoProb])

  // Format betted amounts for display
  const formatBettedAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(4)
  }

  const yesBettedAmount = Number(formatEther(currentYesSharesWei))
  const noBettedAmount = Number(formatEther(currentNoSharesWei))

  // Calculate new probabilities after user's bet
  const amountWei = useMemo(() => {
    try {
      return amount ? parseEther(amount) : 0n
    } catch {
      return 0n
    }
  }, [amount])

  const newYesShares = selectedOutcome === 'yes' ? currentYesSharesWei + amountWei : currentYesSharesWei
  const newNoShares = selectedOutcome === 'no' ? currentNoSharesWei + amountWei : currentNoSharesWei
  const newTotalShares = newYesShares + newNoShares

  const newYesProb = newTotalShares > 0n
    ? Number(newYesShares) / Number(newTotalShares) * 100
    : 50
  const newNoProb = 100 - newYesProb

  const probChange = selectedOutcome === 'yes' 
    ? newYesProb - currentYesProb 
    : newNoProb - currentNoProb

  // Calculate potential payout (ROI)
  const userShares = amountWei
  const sharesOnUserSide = selectedOutcome === 'yes' ? newYesShares : newNoShares
  const totalPool = currentYesSharesWei + currentNoSharesWei

  const potentialPayoutWei = sharesOnUserSide > 0n && totalPool > 0n
    ? (Number(userShares) / Number(sharesOnUserSide)) * Number(totalPool + amountWei)
    : 0

  // Convert to TAO for display
  const potentialPayout = potentialPayoutWei > 0 ? Number(formatEther(BigInt(Math.floor(potentialPayoutWei)))) : 0
  const amountInTAO = Number(formatEther(amountWei))
  const profit = potentialPayout - amountInTAO
  const roiPercentage = amountInTAO > 0 ? (profit / amountInTAO) * 100 : 0

  // Prepare contract write for purchasing shares with native TAO
  const yesShares = selectedOutcome === 'yes' ? amountWei : 0n
  const noShares = selectedOutcome === 'no' ? amountWei : 0n

  const { config, error: prepareError } = usePrepareContractWrite({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'purchaseShares',
    args: [BigInt(market.id), yesShares, noShares],
    value: amountWei,
    enabled: Boolean(isConnected && amountWei > 0n),
  })

  const { data: txData, write: purchaseShares, error: writeError, reset } = useContractWrite(config)

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
  })

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && loadingToastId) {
      dismissToast(loadingToastId)
      setLoadingToastId(null)
      showSuccessToast(`Successfully bet ${amount} TAO on ${selectedOutcome.toUpperCase()}!`)
      
      // Save to Supabase
      if (address && txData?.hash) {
        // Record individual bet
        addBetHistory(
          market.id,
          address,
          selectedOutcome,
          amount,
          txData.hash
        )

        // Record volume snapshot with new cumulative totals
        const newYesVolume = selectedOutcome === 'yes' 
          ? yesBettedAmount + Number(amount)
          : yesBettedAmount
        const newNoVolume = selectedOutcome === 'no'
          ? noBettedAmount + Number(amount)
          : noBettedAmount

        recordVolumeSnapshot(
          market.id,
          newYesVolume.toString(),
          newNoVolume.toString(),
          txData.hash
        )
      }

      setIsPurchasing(false)
      setAmount('')
      
      // Refresh page to show updated stats
      window.location.reload()
    }
  }, [isConfirmed, loadingToastId, selectedOutcome, amount, address, txData, market.id, yesBettedAmount, noBettedAmount])

  // Handle write errors
  useEffect(() => {
    if (writeError && loadingToastId) {
      dismissToast(loadingToastId)
      setLoadingToastId(null)
      
      const errorMessage = writeError?.message || ''
      if (errorMessage.includes('rate limit') || errorMessage.includes('Request exceeds')) {
        showErrorToast(
          new Error('RPC rate limited. Please wait 30 seconds and try again.'),
          'Network Busy'
        )
      } else {
        showErrorToast(writeError, 'Failed to place bet')
      }
      setIsPurchasing(false)
    }
  }, [writeError, loadingToastId])

  const handlePurchase = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showErrorToast(new Error('Please enter a valid amount'), 'Invalid amount')
      return
    }

    if (!purchaseShares) {
      showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
      return
    }

    setIsPurchasing(true)

    try {
      const toastId = showLoadingToast(`Placing bet on ${selectedOutcome.toUpperCase()}...`)
      setLoadingToastId(toastId)
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
      
      purchaseShares()
    } catch (err: any) {
      if (loadingToastId) {
        dismissToast(loadingToastId)
        setLoadingToastId(null)
      }
      showErrorToast(err, 'Failed to place bet')
      setIsPurchasing(false)
    }
  }

  return (
    <Card className="premium-card">
      <CardHeader className="pb-4">
        <h3 className="text-lg font-semibold text-white">Place Your Bet</h3>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Outcome Selection */}
        <div>
          <label className="text-sm text-white/60 mb-3 block font-medium">Select Outcome</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedOutcome('yes')}
              className={`py-4 px-4 rounded-xl text-base font-bold transition-all ${
                selectedOutcome === 'yes'
                  ? 'btn-yes shadow-lg shadow-green-500/20'
                  : 'glass text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div>Yes</div>
              <div className="text-xs font-normal mt-1 opacity-80">
                {formatBettedAmount(yesBettedAmount)} TAO
              </div>
            </button>
            <button
              onClick={() => setSelectedOutcome('no')}
              className={`py-4 px-4 rounded-xl text-base font-bold transition-all ${
                selectedOutcome === 'no'
                  ? 'btn-no shadow-lg shadow-red-500/20'
                  : 'glass text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div>No</div>
              <div className="text-xs font-normal mt-1 opacity-80">
                {formatBettedAmount(noBettedAmount)} TAO
              </div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-sm text-white/60 mb-3 block font-medium">Bet Amount (TAO)</label>
          
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="bg-black/40 border-white/20 text-white text-lg placeholder:text-white/40 h-14 mb-3"
            step="0.1"
            min="0"
          />
          
          {/* Preset Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetAmount(preset)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  amount === preset.toString()
                    ? 'bg-white text-black'
                    : 'glass text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {preset} TAO
              </button>
            ))}
          </div>
        </div>

        {/* ROI Calculation */}
        {amountWei > 0n && (
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-semibold text-white">Expected Returns</h4>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Total on {selectedOutcome === 'yes' ? 'Yes' : 'No'} (after bet)</span>
                <span className="text-white font-medium">
                  {formatBettedAmount(selectedOutcome === 'yes' ? yesBettedAmount + amountInTAO : noBettedAmount + amountInTAO)} TAO
                  <span className="ml-1 text-xs text-green-400">
                    (+{formatBettedAmount(amountInTAO)} TAO)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Your Stake</span>
                <span className="text-white font-medium">{amount} TAO</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">If You Win</span>
                <span className="text-white font-medium">
                  {potentialPayout.toFixed(3)} TAO
                </span>
              </div>

              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Potential Profit</span>
                  <div className="text-right">
                    <div className="text-white font-bold">
                      +{profit.toFixed(3)} TAO
                    </div>
                    <div className={`text-xs font-semibold ${roiPercentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {roiPercentage > 0 ? '+' : ''}{roiPercentage.toFixed(1)}% ROI
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-3 p-2 bg-blue-500/10 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                ROI assumes market resolves in your favor. 2.5% platform fee applied.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {prepareError && amountWei > 0n && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">
              Unable to prepare transaction. Please check your balance and try again.
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {isConfirming && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0"></div>
            <p className="text-xs text-blue-200">Confirming transaction...</p>
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          isMounted && (
            <div className="pt-2">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button 
                    onClick={openConnectModal}
                    className="w-full btn-primary h-14 text-base font-bold rounded-xl"
                  >
                    Connect Wallet to Bet
                  </Button>
                )}
              </ConnectButton.Custom>
            </div>
          )
        ) : (
          <Button 
            onClick={handlePurchase}
            className={`w-full h-14 text-base font-bold rounded-xl ${
              selectedOutcome === 'yes' ? 'btn-yes' : 'btn-no'
            }`}
            disabled={!amount || parseFloat(amount) <= 0 || isPurchasing || isConfirming || !purchaseShares || isBettingDisabled}
          >
            {isBettingDisabled ? (
              market.resolved ? 'Market Resolved' : 'Betting Closed'
            ) : isPurchasing || isConfirming ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isConfirming ? 'Confirming...' : 'Processing...'}</span>
              </span>
            ) : (
              `Bet ${amount || '0'} TAO on ${selectedOutcome.toUpperCase()}`
            )}
          </Button>
        )}

        {/* Market Stats */}
        <div className="glass rounded-lg p-4 space-y-3 border-t border-white/10 pt-5">
          <h4 className="text-sm font-semibold text-white mb-3">Market Stats</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Total Liquidity</span>
              <span className="text-white">{market.liquidity?.toFixed(2) || '0'} TAO</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Volume</span>
              <span className="text-white">{market.volume?.toFixed(2) || '0'} TAO</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Deadline</span>
              <span className="text-white">
                {new Date(market.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Status</span>
              <span className={`text-xs px-2 py-1 rounded ${
                market.resolved 
                  ? 'bg-gray-500/20 text-gray-300' 
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {market.resolved ? 'Resolved' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-white/40 text-center mt-4">
          By placing a bet, you agree to the platform's terms and conditions.
        </p>
      </CardContent>
    </Card>
  )
}


