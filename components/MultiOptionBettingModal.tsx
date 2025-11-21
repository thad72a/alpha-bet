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

interface MultiOptionBettingModalProps {
  isOpen: boolean
  onClose: () => void
  cardId: number
  optionNames: string[]
  optionStakes: bigint[] // Total stakes per option
  initialOptionIndex?: number
  onSuccess?: () => void
}

const PRESET_AMOUNTS = [1, 3, 5, 10]

export function MultiOptionBettingModal({
  isOpen,
  onClose,
  cardId,
  optionNames,
  optionStakes,
  initialOptionIndex = 0,
  onSuccess
}: MultiOptionBettingModalProps) {
  const { address, isConnected } = useAccount()
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(initialOptionIndex)
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOptionIndex(initialOptionIndex)
      setAmount('')
      setCustomAmount(false)
      setIsPurchasing(false)
    }
  }, [isOpen, initialOptionIndex])

  // Calculate current probabilities for each option
  const totalStakes = useMemo(() => {
    return optionStakes.reduce((sum, stake) => sum + stake, 0n)
  }, [optionStakes])

  const currentProbabilities = useMemo(() => {
    if (totalStakes === 0n) {
      // Equal probability if no stakes yet
      return optionNames.map(() => 100 / optionNames.length)
    }
    return optionStakes.map(stake => 
      (Number(stake) / Number(totalStakes)) * 100
    )
  }, [optionStakes, totalStakes, optionNames.length])

  // Calculate new probabilities after user's bet
  const amountWei = useMemo(() => {
    try {
      return amount ? parseEther(amount) : 0n
    } catch {
      return 0n
    }
  }, [amount])

  const newStakes = useMemo(() => {
    return optionStakes.map((stake, index) => 
      index === selectedOptionIndex ? stake + amountWei : stake
    )
  }, [optionStakes, selectedOptionIndex, amountWei])

  const newTotalStakes = useMemo(() => {
    return newStakes.reduce((sum, stake) => sum + stake, 0n)
  }, [newStakes])

  const newProbabilities = useMemo(() => {
    if (newTotalStakes === 0n) {
      return optionNames.map(() => 100 / optionNames.length)
    }
    return newStakes.map(stake => 
      (Number(stake) / Number(newTotalStakes)) * 100
    )
  }, [newStakes, newTotalStakes, optionNames.length])

  // Calculate ROI
  const currentProb = currentProbabilities[selectedOptionIndex]
  const newProb = newProbabilities[selectedOptionIndex]
  const probChange = newProb - currentProb

  // Calculate potential payout (if this option wins)
  const userStake = amountWei
  const totalStakeOnOption = newStakes[selectedOptionIndex]
  const totalPoolNet = newTotalStakes // Net pool after fees
  
  const potentialPayout = totalStakeOnOption > 0n && totalPoolNet > 0n
    ? (Number(userStake) / Number(totalStakeOnOption)) * Number(totalPoolNet)
    : 0

  const profit = potentialPayout - Number(formatEther(amountWei))
  const roiPercentage = amountWei > 0n ? (profit / Number(formatEther(amountWei))) * 100 : 0

  // Prepare contract write
  const { config, error: prepareError } = usePrepareContractWrite({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'placeBetOnOption',
    args: [BigInt(cardId), BigInt(selectedOptionIndex)],
    value: amountWei,
    enabled: Boolean(isConnected && amountWei > 0n),
  })

  const { data: txData, write: placeBet, error: writeError, reset } = useContractWrite(config)

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
  })

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && loadingToastId) {
      dismissToast(loadingToastId)
      setLoadingToastId(null)
      showSuccessToast(`Successfully bet ${amount} TAO on "${optionNames[selectedOptionIndex]}"!`)
      
      // Save to Supabase
      if (address && txData?.hash) {
        // Ensure transaction hash is a string (not BigInt)
        const txHashString = String(txData.hash)
        
        addBetHistory(
          cardId,
          address,
          'option',
          amount,
          txHashString,
          selectedOptionIndex
        )
      }

      setIsPurchasing(false)
      onSuccess?.()
      onClose()
    }
  }, [isConfirmed, loadingToastId, amount, selectedOptionIndex, optionNames, cardId, address, txData, onSuccess, onClose])

  // Handle errors
  useEffect(() => {
    if (writeError && loadingToastId) {
      dismissToast(loadingToastId)
      setLoadingToastId(null)
      showErrorToast(writeError, 'Failed to place bet')
      setIsPurchasing(false)
    }
  }, [writeError, loadingToastId])

  const handlePurchase = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showErrorToast(new Error('Please enter a valid amount'), 'Invalid amount')
      return
    }

    if (!placeBet) {
      showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
      return
    }

    setIsPurchasing(true)

    try {
      const toastId = showLoadingToast(`Placing bet on "${optionNames[selectedOptionIndex]}"...`)
      setLoadingToastId(toastId)
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
      
      placeBet()
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
        showErrorToast(err, 'Failed to place bet')
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

  // Color classes for options
  const getOptionColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600',
    ]
    return colors[index % colors.length]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/20 text-white max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
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
          {/* Option Selection */}
          <div>
            <label className="text-sm text-white/60 mb-3 block font-medium">Select Option</label>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {optionNames.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOptionIndex(index)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedOptionIndex === index
                      ? `bg-gradient-to-r ${getOptionColor(index)} shadow-lg`
                      : 'glass text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{option}</div>
                    <div className="text-right">
                      <div className="text-base font-bold">
                        {formatEther(optionStakes[index])} TAO
                      </div>
                      <div className="text-xs opacity-60">
                        {currentProbabilities[index].toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                </button>
              ))}
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
                  <span className="text-white/60">Selected Option</span>
                  <span className="text-white font-medium truncate ml-2 max-w-[200px]">
                    {optionNames[selectedOptionIndex]}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">New Probability</span>
                  <span className="text-white font-medium">
                    {newProb.toFixed(1)}%
                    <span className={`ml-1 text-xs ${probChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ({probChange > 0 ? '+' : ''}{probChange.toFixed(1)}%)
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
                  ROI assumes your selected option wins. 2.5% platform fee applied.
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
              className={`w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r ${getOptionColor(selectedOptionIndex)} hover:opacity-90`}
              disabled={!amount || parseFloat(amount) <= 0 || isPurchasing || isConfirming || !placeBet}
            >
              {isPurchasing || isConfirming ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{isConfirming ? 'Confirming...' : 'Processing...'}</span>
                </span>
              ) : (
                `Bet ${amount || '0'} TAO`
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

