'use client'

import { useState } from 'react'
import { useContractWrite, usePrepareContractWrite } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubnetData } from '@/types/subnet'
import { formatTimestamp } from '@/lib/bittensor'
import { 
  Target, 
  Eye, 
  Rocket, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Activity
} from 'lucide-react'
import { BETTING_CONTRACT_ADDRESS, BETTING_ABI } from '@/lib/contracts'

interface CreateCardModalProps {
  subnets: SubnetData[]
  onClose: () => void
  onCardCreated: (card: any) => void
}

export function CreateCardModal({ subnets, onClose, onCardCreated }: CreateCardModalProps) {
  const [selectedSubnet, setSelectedSubnet] = useState<SubnetData | null>(null)
  const [bettedPrice, setBettedPrice] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { config } = usePrepareContractWrite({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_ABI,
    functionName: 'createCard',
    args: selectedSubnet && bettedPrice && timestamp ? [
      BigInt(selectedSubnet.netuid),
      BigInt(Math.floor(parseFloat(bettedPrice) * 1e18)), // Convert to wei
      BigInt(Math.floor(new Date(timestamp).getTime() / 1000))
    ] : undefined,
  })

  const { write: createCard } = useContractWrite({
    ...config,
    onSuccess: (data) => {
      console.log('Card created:', data)
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
        creationTime: Math.floor(Date.now() / 1000)
      }
      onCardCreated(newCard)
      setIsSubmitting(false)
    },
    onError: (error) => {
      console.error('Error creating card:', error)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubnet || !bettedPrice || !timestamp) return

    setIsSubmitting(true)
    createCard?.()
  }

  const isFormValid = selectedSubnet && bettedPrice && timestamp && 
    parseFloat(bettedPrice) > 0 && 
    new Date(timestamp).getTime() > Date.now()

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

            {/* Betted Price */}
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
            {isFormValid && (
              <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20">
                <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Subnet:</span>
                    <span className="text-white font-medium">{selectedSubnet.name} (NetUID {selectedSubnet.netuid})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Current Price:</span>
                    <span className="text-neon-blue font-medium">{selectedSubnet.alphaPrice} TAO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Predicted Price:</span>
                    <span className="text-neon-green font-medium">{bettedPrice} TAO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Deadline:</span>
                    <span className="text-white font-medium">{formatTimestamp(Math.floor(new Date(timestamp).getTime() / 1000))}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-white/80">
                      <strong>Question:</strong> Will Subnet {selectedSubnet.netuid} alpha price be ≥ {bettedPrice} TAO by {formatTimestamp(Math.floor(new Date(timestamp).getTime() / 1000))}?
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl glow"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
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

