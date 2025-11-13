'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BETTING_CONTRACT_ADDRESS, BETTING_ABI } from '@/lib/contracts'
import { showErrorToast, showSuccessToast, showLoadingToast, dismissToast } from '@/lib/errorHandling'
import { addBetHistory } from '@/lib/supabase'
import { X, TrendingUp, AlertCircle, Info } from 'lucide-react'

interface BettingModalProps {
  isOpen: boolean
  onClose: () => void
  cardId: number
  initialOutcome?: 'yes' | 'no'
  currentYesShares: bigint
  currentNoShares: bigint
  onSuccess?: () => void
}

const PRESET_AMOUNTS = [1, 3, 5, 10]

export function BettingModal({
  isOpen,
  onClose,
  cardId,
  initialOutcome = 'yes',
  currentYesShares,
  currentNoShares,
  onSuccess
}: BettingModalProps) {
  const { address, isConnected } = useAccount()
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>(initialOutcome)
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOutcome(initialOutcome)
      setAmount('')
      setCustomAmount(false)
      setIsPurchasing(false)
    }
  }, [isOpen, initialOutcome])

  // Calculate current probabilities
  const totalShares = currentYesShares + currentNoShares
  const currentYesProb = totalShares > 0n 
    ? Number(currentYesShares) / Number(totalShares) * 100 
    : 50
  const currentNoProb = 100 - currentYesProb

  // Calculate new probabilities after user's bet
  const amountWei = useMemo(() => {
    try {
      return amount ? parseEther(amount) : 0n
    } catch {
      return 0n
    }
  }, [amount])

  const newYesShares = selectedOutcome === 'yes' ? currentYesShares + amountWei : currentYesShares
  const newNoShares = selectedOutcome === 'no' ? currentNoShares + amountWei : currentNoShares
  const newTotalShares = newYesShares + newNoShares

  const newYesProb = newTotalShares > 0n
    ? Number(newYesShares) / Number(newTotalShares) * 100
    : 50
  const newNoProb = 100 - newYesProb

  // Calculate ROI
  const probChange = selectedOutcome === 'yes' 
    ? newYesProb - currentYesProb 
    : newNoProb - currentNoProb

  // Calculate potential payout
  const totalPool = currentYesShares + currentNoShares
  const userShares = amountWei
  const sharesOnUserSide = selectedOutcome === 'yes' ? newYesShares : newNoShares

  const potentialPayout = sharesOnUserSide > 0n && totalPool > 0n
    ? (Number(userShares) / Number(sharesOnUserSide)) * Number(totalPool + amountWei)
    : 0

  const profit = potentialPayout - Number(formatEther(amountWei))
  const roiPercentage = amountWei > 0n ? (profit / Number(formatEther(amountWei))) * 100 : 0

  // Prepare contract write
  const yesShares = selectedOutcome === 'yes' ? amountWei : 0n
  const noShares = selectedOutcome === 'no' ? amountWei : 0n

  const { config, error: prepareError } = usePrepareContractWrite({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'purchaseShares',
    args: [BigInt(cardId), yesShares, noShares],
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
      showSuccessToast(`Successfully purchased ${amount} TAO of ${selectedOutcome.toUpperCase()} shares!`)
      
      // Save to Supabase
      if (address && txData?.hash) {
        addBetHistory(
          cardId,
          address,
          selectedOutcome,
          amount,
          txData.hash
        )
      }

      setIsPurchasing(false)
      onSuccess?.()
      onClose()
    }
  }, [isConfirmed, loadingToastId, selectedOutcome, amount, cardId, address, txData, onSuccess, onClose])

  // Handle errors
  useEffect(() => {
    if (writeError && loadingToastId) {
      dismissToast(loadingToastId)
      setLoadingToastId(null)
      showErrorToast(writeError, 'Failed to purchase shares')
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
      const toastId = showLoadingToast(`Purchasing ${selectedOutcome.toUpperCase()} shares...`)
      setLoadingToastId(toastId)
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
      
      purchaseShares()
    } catch (err: any) {
      if (loadingToastId) {
        dismissToast(loadingToastId)
        setLoadingToastId(null)
      }
      
      // Check if it's a rate limit error
      const errorMessage = err?.message || ''
      if (errorMessage.includes('rate limit') || errorMessage.includes('Request exceeds')) {
        showErrorToast(
          new Error('RPC rate limited. Please wait 30 seconds and try again.'),
          'Network Busy'
        )
      } else {
        showErrorToast(err, 'Failed to purchase shares')
      }
      setIsPurchasing(false)
    }
  }

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString())
    setCustomAmount(false)
  }

  const handleCustomAmountClick = () => {
    setCustomAmount(true)
    setAmount('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/20 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Place Your Bet</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
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
                  {currentYesProb.toFixed(1)}%
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
                  {currentNoProb.toFixed(1)}%
                </div>
              </button>
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <label className="text-sm text-white/60 mb-3 block font-medium">
              Bet Amount (TAO)
            </label>
            
            {!customAmount ? (
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountSelect(preset)}
                    className={`py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                      amount === preset.toString()
                        ? 'bg-white text-black'
                        : 'glass text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {preset} TAO
                  </button>
                ))}
                <button
                  onClick={handleCustomAmountClick}
                  className="py-3 px-4 rounded-lg text-base font-semibold glass text-white/80 hover:text-white hover:bg-white/10 transition-all col-span-3"
                >
                  Custom Amount
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-3 pr-12 bg-black/40 border-white/20 text-white text-lg placeholder:text-white/40 h-14"
                    autoFocus
                    step="0.1"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 font-medium">
                    TAO
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCustomAmount(false)
                    setAmount('')
                  }}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  ← Back to presets
                </button>
              </div>
            )}
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
                  <span className="text-white/60">New Probability</span>
                  <span className="text-white font-medium">
                    {selectedOutcome === 'yes' ? newYesProb.toFixed(1) : newNoProb.toFixed(1)}%
                    <span className={`ml-1 text-xs ${probChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ({probChange > 0 ? '+' : ''}{probChange.toFixed(1)}%)
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Your Shares</span>
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

          {/* Action Button */}
          {!isConnected ? (
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
          ) : (
            <Button 
              onClick={handlePurchase}
              className={`w-full h-14 text-base font-bold rounded-xl ${
                selectedOutcome === 'yes' ? 'btn-yes' : 'btn-no'
              }`}
              disabled={!amount || parseFloat(amount) <= 0 || isPurchasing || isConfirming || !purchaseShares}
            >
              {isPurchasing || isConfirming ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{isConfirming ? 'Confirming...' : 'Processing...'}</span>
                </span>
              ) : (
                `Bet ${amount || '0'} TAO on ${selectedOutcome.toUpperCase()}`
              )}
            </Button>
          )}

          {/* Terms */}
          <p className="text-xs text-white/40 text-center">
            By placing a bet, you agree to the platform's terms and conditions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

