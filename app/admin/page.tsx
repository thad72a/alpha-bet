'use client'

import { useState } from 'react'
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandling'
import { TAO_CONTRACT_ADDRESS, TAO_ABI } from '@/lib/contracts'

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const { config } = usePrepareContractWrite({
    address: TAO_CONTRACT_ADDRESS as `0x${string}`,
    abi: TAO_ABI,
    functionName: 'transfer',
    args: recipient && amount ? [
      recipient as `0x${string}`,
      parseEther(amount)
    ] : undefined,
    enabled: Boolean(recipient && amount && isConnected),
  })

  const { write: transfer, isLoading } = useContractWrite({
    ...config,
    onSuccess: () => {
      showSuccessToast(`Successfully sent ${amount} MockTAO!`)
      setRecipient('')
      setAmount('')
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to send MockTAO')
    }
  })

  const { write: claimFaucet, isLoading: isClaiming } = useContractWrite({
    address: TAO_CONTRACT_ADDRESS as `0x${string}`,
    abi: TAO_ABI,
    functionName: 'faucet',
    onSuccess: () => {
      showSuccessToast('Claimed 1000 MockTAO from faucet!')
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to claim from faucet')
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-white mb-8">MockTAO Admin</h1>

        {/* Faucet */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-white">Get Free MockTAO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60 mb-4">
              Claim 1000 MockTAO tokens instantly (anyone can do this!)
            </p>
            <Button
              onClick={() => claimFaucet?.()}
              disabled={!isConnected || isClaiming}
              className="btn-primary w-full"
            >
              {isClaiming ? 'Claiming...' : 'Claim 1000 MockTAO from Faucet'}
            </Button>
          </CardContent>
        </Card>

        {/* Transfer */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-white">Send MockTAO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipient" className="text-white">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-white">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button
              onClick={() => transfer?.()}
              disabled={!transfer || isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Sending...' : 'Send MockTAO'}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="premium-card">
          <CardContent className="p-6">
            <p className="text-white/60 text-sm">
              <strong>MockTAO Contract:</strong><br />
              <code className="text-white/80">{TAO_CONTRACT_ADDRESS}</code>
            </p>
            <p className="text-white/60 text-sm mt-2">
              <strong>Your Address:</strong><br />
              <code className="text-white/80">{address || 'Not connected'}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

