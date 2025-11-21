'use client'

import { useState, useEffect } from 'react'
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubnetData } from '@/types/subnet'
import { useSubnetSummaries } from '@/components/SubnetProvider'
import { formatTimestamp } from '@/lib/bittensor'
import { showErrorToast, showSuccessToast, showLoadingToast, dismissToast } from '@/lib/errorHandling'
import { 
  Target, 
  Eye, 
  Rocket, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Activity,
  AlertCircle
} from 'lucide-react'
import { BETTING_CONTRACT_ADDRESS, BETTING_ABI } from '@/lib/contracts'

interface CreateCardModalProps {
  subnets: SubnetData[]
  onClose: () => void
  onCardCreated: (card: any) => void
}

export function CreateCardModal({ subnets, onClose, onCardCreated }: CreateCardModalProps) {
  const [selectedSubnet, setSelectedSubnet] = useState<SubnetData | null>(null)
  const [cardType, setCardType] = useState<'binary' | 'multi'>('binary')
  const [bettedPrice, setBettedPrice] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { summaries } = useSubnetSummaries()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingToastId) {
        dismissToast(loadingToastId)
      }
    }
  }, [loadingToastId])

  // On mount or summaries change, refresh subnet list for realtime options
  useEffect(() => {
    ;(async () => {
      try {
        const list: SubnetData[] = Object.values(summaries).map((s) => ({
          netuid: s.netuid,
          name: s.subnet_name || `Subnet ${s.netuid}`,
          alphaPrice: typeof s.price === 'number' ? s.price : 0,
          validatorCount: typeof s.n === 'number' ? s.n : 0,
          minerCount: 0,
          totalStake: 0,
          emissionRate: typeof s.tao_in_emission === 'number' ? s.tao_in_emission : 0,
          lastUpdate: Date.now(),
        }))
        // If no selected subnet yet, preselect first option
        if (!selectedSubnet && list.length > 0) {
          setSelectedSubnet(list[0])
        }
      } catch {
        // Ignore; will use subnets prop
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaries])

  // Validate inputs before preparing transaction
  const isValidPrice = cardType === 'binary' && bettedPrice && !isNaN(parseFloat(bettedPrice)) && parseFloat(bettedPrice) > 0
  const isValidOptions = cardType === 'multi' && options.length >= 2 && options.every(opt => opt.trim().length > 0)
  const isValidTimestamp = timestamp && new Date(timestamp).getTime() > Date.now()
  
  // Prepare contract write for Binary cards
  const { config: binaryConfig, error: binaryPrepareError } = usePrepareContractWrite({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'createCard',
    args: selectedSubnet && isValidPrice && isValidTimestamp ? [
      BigInt(selectedSubnet.netuid),
      BigInt(Math.floor(parseFloat(bettedPrice) * 1e18)), // Convert to wei
      BigInt(Math.floor(new Date(timestamp).getTime() / 1000))
    ] : undefined,
    enabled: Boolean(cardType === 'binary' && selectedSubnet && isValidPrice && isValidTimestamp),
  })

  // Prepare contract write for Multi-option cards
  const { config: multiConfig, error: multiPrepareError } = usePrepareContractWrite({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'createCardMulti',
    args: selectedSubnet && isValidOptions && isValidTimestamp ? [
      BigInt(selectedSubnet.netuid),
      options.filter(opt => opt.trim().length > 0),
      BigInt(Math.floor(new Date(timestamp).getTime() / 1000))
    ] : undefined,
    enabled: Boolean(cardType === 'multi' && selectedSubnet && isValidOptions && isValidTimestamp),
  })

  const config = cardType === 'binary' ? binaryConfig : multiConfig
  const prepareError = cardType === 'binary' ? binaryPrepareError : multiPrepareError

  const { data: txData, write: createCard, error: writeError, reset } = useContractWrite(config)

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
  })

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && loadingToastId) {
      dismissToast(loadingToastId)
      setLoadingToastId(null)
      showSuccessToast('Market created successfully!')
      
      // In a real app, you'd fetch the created card data
      const newCard = {
        id: Date.now(), // Mock ID
        netuid: selectedSubnet?.netuid,
        bettedAlphaPrice: parseFloat(bettedPrice),
        timestamp: Math.floor(new Date(timestamp).getTime() / 1000),
        creator: '0x...', // Would be actual creator address
        totalYesShares: 0,
        totalNoShares: 0,
        totalLiquidity: 0,
        resolved: false,
        outcome: false,
        creationTime: Math.floor(Date.now() / 1000),
        type: 'price-threshold' as const,
        currentAlphaPrice: selectedSubnet?.alphaPrice || 0,
        priceChange: 0,
        volume: 0,
        frequency: 'Weekly',
        question: `Will Subnet ${selectedSubnet?.netuid} alpha price be ≥ ${bettedPrice} TAO?`
      }
      onCardCreated(newCard)
      setIsSubmitting(false)
    }
  }, [isConfirmed, loadingToastId, selectedSubnet, bettedPrice, timestamp, onCardCreated])

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      if (loadingToastId) {
        dismissToast(loadingToastId)
        setLoadingToastId(null)
      }
      showErrorToast(writeError, 'Failed to create market')
      setIsSubmitting(false)
      setError('Transaction failed. Please try again.')
      // Reset after showing error
      setTimeout(() => {
        setError(null)
        reset()
      }, 5000)
    }
  }, [writeError, loadingToastId, reset])

  // Show prepare errors - don't wait for isSubmitting
  useEffect(() => {
    if (prepareError) {
      console.error('Prepare error:', prepareError)
      showErrorToast(prepareError, 'Failed to prepare transaction')
    }
  }, [prepareError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubnet || !timestamp) {
      setError('Please fill in all fields')
      return
    }

    // Validate inputs based on card type
    if (cardType === 'binary') {
      if (!bettedPrice || parseFloat(bettedPrice) <= 0) {
        setError('Price must be greater than 0')
        return
      }
    } else {
      const validOptions = options.filter(opt => opt.trim().length > 0)
      if (validOptions.length < 2) {
        setError('Multi-option cards must have at least 2 options')
        return
      }
    }

    const deadlineTime = new Date(timestamp).getTime()
    if (deadlineTime <= Date.now()) {
      setError('Deadline must be in the future')
      return
    }

    // Check if contract address is set
    if (!BETTING_CONTRACT_ADDRESS) {
      setError('Contract address not configured. Please check your environment variables.')
      if (process.env.NODE_ENV === 'development') {
        console.error('BETTING_CONTRACT_ADDRESS is:', BETTING_CONTRACT_ADDRESS)
      }
      return
    }

    // Debug info
    if (process.env.NODE_ENV === 'development') {
      console.log('Contract setup:', {
        address: BETTING_CONTRACT_ADDRESS,
        hasConfig: !!config,
        hasWrite: !!createCard,
        prepareError: prepareError?.message,
        args: [
          selectedSubnet.netuid,
          parseFloat(bettedPrice),
          Math.floor(new Date(timestamp).getTime() / 1000)
        ]
      })
    }

    if (!createCard) {
      // Show specific error based on what's wrong
      if (prepareError) {
        setError(`Transaction preparation failed: ${prepareError.message || 'Unknown error'}`)
      } else if (!config) {
        setError('Unable to prepare transaction. Please ensure your wallet is connected to the correct network.')
      } else {
        setError('Unable to create transaction. Please check your wallet connection and network.')
      }
      return
    }

    setError(null)
    setIsSubmitting(true)
    
    try {
      const toastId = showLoadingToast('Creating market...')
      setLoadingToastId(toastId)
      createCard()
    } catch (err: any) {
      // Use the local toastId, not the state variable
      const currentToastId = loadingToastId
      if (currentToastId) {
        dismissToast(currentToastId)
        setLoadingToastId(null)
      }
      showErrorToast(err, 'Failed to create market')
      setIsSubmitting(false)
      setError('Failed to submit transaction')
    }
  }

  const isFormValid = selectedSubnet && timestamp && 
    new Date(timestamp).getTime() > Date.now() &&
    (cardType === 'binary' ? (bettedPrice && parseFloat(bettedPrice) > 0) : (options.filter(opt => opt.trim().length > 0).length >= 2))

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass border-white/20 animate-slide-in">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Create New Betting Card</CardTitle>
              <CardDescription className="text-white/70">
                Create a prediction market for a subnet alpha token price
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Type Selection */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Market Type</Label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setCardType('binary')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    cardType === 'binary'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Binary (YES/NO)</span>
                  </div>
                  <p className="text-xs text-white/60">
                    Bet on whether price will reach a threshold
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('multi')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    cardType === 'multi'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Multi-Option</span>
                  </div>
                  <p className="text-xs text-white/60">
                    Bet on multiple possible outcomes
                  </p>
                </button>
              </div>
            </div>

            {/* Subnet Selection */}
            <div className="space-y-3">
              <Label htmlFor="subnet" className="text-white font-medium">Select Subnet</Label>
              <select
                id="subnet"
                value={selectedSubnet?.netuid || ''}
                onChange={(e) => {
                  const netuid = parseInt(e.target.value)
                  const subnet = subnets.find(s => s.netuid === netuid)
                  setSelectedSubnet(subnet || null)
                }}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none"
                required
              >
                <option value="" className="bg-slate-800 text-white">Choose a subnet...</option>
                {subnets.map((subnet) => (
                  <option key={subnet.netuid} value={subnet.netuid} className="bg-slate-800 text-white">
                    Subnet {subnet.netuid} - {subnet.name} (Current: {subnet.alphaPrice} TAO)
                  </option>
                ))}
              </select>
            </div>

            {/* Current Price Display */}
            {selectedSubnet && (
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                <h4 className="font-medium text-white mb-2 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Current Alpha Price</span>
                </h4>
                <p className="text-3xl font-bold text-neon-blue mb-3">
                  {selectedSubnet.alphaPrice} TAO
                </p>
                <div className="flex items-center space-x-4 text-sm text-white/70">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Validators: {selectedSubnet.validatorCount}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>Miners: {selectedSubnet.minerCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Binary: Betted Price */}
            {cardType === 'binary' && (
              <div className="space-y-3">
                <Label htmlFor="price" className="text-white font-medium">Predicted Alpha Price (TAO)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={bettedPrice}
                  onChange={(e) => setBettedPrice(e.target.value)}
                  placeholder="0.0250"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-green-400 focus:ring-green-400/20"
                  required
                />
                <p className="text-sm text-white/60">
                  Enter the price you think the alpha token will reach
                </p>
              </div>
            )}

            {/* Multi: Options */}
            {cardType === 'multi' && (
              <div className="space-y-3">
                <Label className="text-white font-medium">Outcome Options</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index] = e.target.value
                        setOptions(newOptions)
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/20"
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOptions(options.filter((_, i) => i !== index))}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOptions([...options, ''])}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  + Add Option
                </Button>
                <p className="text-sm text-white/60">
                  Add at least 2 possible outcomes for this market
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div className="space-y-3">
              <Label htmlFor="timestamp" className="text-white font-medium">Prediction Deadline</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="bg-white/10 border-white/20 text-white focus:border-purple-400 focus:ring-purple-400/20"
                required
              />
              <p className="text-sm text-white/60">
                When should this prediction be resolved?
              </p>
            </div>

            {/* Preview */}
            {isFormValid && selectedSubnet && (
              <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20">
                <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Market Type:</span>
                    <span className="text-white font-medium">{cardType === 'binary' ? 'Binary (YES/NO)' : 'Multi-Option'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Subnet:</span>
                    <span className="text-white font-medium">{selectedSubnet.name} (NetUID {selectedSubnet.netuid})</span>
                  </div>
                  {cardType === 'binary' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60">Current Price:</span>
                        <span className="text-neon-blue font-medium">{selectedSubnet.alphaPrice} TAO</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Predicted Price:</span>
                        <span className="text-neon-green font-medium">{bettedPrice} TAO</span>
                      </div>
                    </>
                  )}
                  {cardType === 'multi' && (
                    <div>
                      <span className="text-white/60">Options:</span>
                      <ul className="mt-2 space-y-1">
                        {options.filter(opt => opt.trim().length > 0).map((opt, idx) => (
                          <li key={idx} className="text-white font-medium ml-4">• {opt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60">Deadline:</span>
                    <span className="text-white font-medium">{formatTimestamp(Math.floor(new Date(timestamp).getTime() / 1000))}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-white/80">
                      <strong>Question:</strong> {cardType === 'binary' 
                        ? `Will Subnet ${selectedSubnet.netuid} alpha price be ≥ ${bettedPrice} TAO by ${formatTimestamp(Math.floor(new Date(timestamp).getTime() / 1000))}?`
                        : `Subnet ${selectedSubnet.netuid} outcome by ${formatTimestamp(Math.floor(new Date(timestamp).getTime() / 1000))}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {isConfirming && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start space-x-3">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-blue-200">Confirming transaction...</p>
                  <p className="text-xs text-blue-300/60 mt-1">Please wait while your transaction is being confirmed on the blockchain.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isSubmitting || isConfirming) {
                    if (confirm('Transaction in progress. Are you sure you want to close? You may lose track of this transaction.')) {
                      if (loadingToastId) {
                        dismissToast(loadingToastId)
                      }
                      onClose()
                    }
                  } else {
                    onClose()
                  }
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting || isConfirming}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isConfirming ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isConfirming ? 'Confirming...' : 'Creating...'}</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>Create Card</span>
                    <Rocket className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

