'use client'

import { useState, useEffect, useMemo } from 'react'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { showErrorToast, showSuccessToast, showLoadingToast, dismissToast } from '@/lib/errorHandling'
import { 
  useProposal, 
  useResolutionBond,
  useDisputePeriod,
  useVotingPeriod,
  useProposeResolution,
  useProposeResolutionMulti,
  useDisputeResolution,
  useVoteOnResolution,
  useFinalizeResolution
} from '@/lib/contract-hooks'
import { RESOLUTION_SUCCESS_DELAY } from '@/lib/constants'
import { AlertCircle, Clock, Shield, Vote, CheckCircle, Info, Gavel } from 'lucide-react'

interface ResolutionPanelProps {
  market: any
  onResolutionSuccess?: () => void
}

export function ResolutionPanel({ market, onResolutionSuccess }: ResolutionPanelProps) {
  const { address, isConnected } = useAccount()
  const [actualPrice, setActualPrice] = useState<string>('')
  const [selectedOption, setSelectedOption] = useState<number>(0)
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch proposal and system parameters
  const { proposal, hasProposal, refetch: refetchProposal } = useProposal(market.id)
  const { bond: resolutionBond } = useResolutionBond()
  const { period: disputePeriod } = useDisputePeriod()
  const { period: votingPeriod } = useVotingPeriod()

  // Calculate time remaining for dispute/voting periods
  const timeRemaining = useMemo(() => {
    if (!proposal || !hasProposal) return null

    const now = Math.floor(Date.now() / 1000)
    const proposalTime = Number(proposal.proposalTime)
    const disputeEnd = proposalTime + Number(disputePeriod || 0n)
    const votingEnd = disputeEnd + Number(votingPeriod || 0n)

    if (!proposal.disputed) {
      // In dispute period
      const remaining = disputeEnd - now
      return {
        phase: 'dispute',
        seconds: Math.max(0, remaining),
        ended: remaining <= 0
      }
    } else if (proposal.votingActive) {
      // In voting period
      const remaining = votingEnd - now
      return {
        phase: 'voting',
        seconds: Math.max(0, remaining),
        ended: remaining <= 0
      }
    } else {
      // Ready to finalize
      return {
        phase: 'finalize',
        seconds: 0,
        ended: true
      }
    }
  }, [proposal, hasProposal, disputePeriod, votingPeriod])

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Ended'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  // Hook for proposing resolution
  const { 
    propose: proposeBinary, 
    isLoading: isProposingBinary,
    isSuccess: proposalSuccessBinary 
  } = useProposeResolution(market.id, actualPrice || '0')

  const { 
    propose: proposeMulti, 
    isLoading: isProposingMulti,
    isSuccess: proposalSuccessMulti 
  } = useProposeResolutionMulti(market.id, selectedOption)

  // Hook for disputing
  const { 
    dispute, 
    isLoading: isDisputing,
    isSuccess: disputeSuccess 
  } = useDisputeResolution(market.id, proposal?.bondAmount || 0n)

  // Hooks for voting
  const { 
    vote: voteYes, 
    isLoading: isVotingYes,
    isSuccess: voteYesSuccess 
  } = useVoteOnResolution(market.id, true)

  const { 
    vote: voteNo, 
    isLoading: isVotingNo,
    isSuccess: voteNoSuccess 
  } = useVoteOnResolution(market.id, false)

  // Hook for finalizing
  const { 
    finalize, 
    isLoading: isFinalizing,
    isSuccess: finalizeSuccess 
  } = useFinalizeResolution(market.id)

  const isProposing = isProposingBinary || isProposingMulti
  const isVoting = isVotingYes || isVotingNo

  // Handle success states
  useEffect(() => {
    if (proposalSuccessBinary || proposalSuccessMulti) {
      if (loadingToastId) dismissToast(loadingToastId)
      showSuccessToast('Resolution proposed successfully!')
      setActualPrice('')
      setTimeout(() => {
        refetchProposal()
        if (onResolutionSuccess) {
          onResolutionSuccess()
        }
      }, RESOLUTION_SUCCESS_DELAY)
    }
  }, [proposalSuccessBinary, proposalSuccessMulti, loadingToastId, refetchProposal])

  useEffect(() => {
    if (disputeSuccess) {
      if (loadingToastId) dismissToast(loadingToastId)
      showSuccessToast('Resolution disputed successfully!')
      setTimeout(() => {
        refetchProposal()
        if (onResolutionSuccess) {
          onResolutionSuccess()
        }
      }, RESOLUTION_SUCCESS_DELAY)
    }
  }, [disputeSuccess, loadingToastId, refetchProposal])

  useEffect(() => {
    if (voteYesSuccess || voteNoSuccess) {
      if (loadingToastId) dismissToast(loadingToastId)
      showSuccessToast('Vote cast successfully!')
      setTimeout(() => {
        refetchProposal()
        if (onResolutionSuccess) {
          onResolutionSuccess()
        }
      }, RESOLUTION_SUCCESS_DELAY)
    }
  }, [voteYesSuccess, voteNoSuccess, loadingToastId, refetchProposal])

  useEffect(() => {
    if (finalizeSuccess) {
      if (loadingToastId) dismissToast(loadingToastId)
      showSuccessToast('Resolution finalized successfully!')
      setTimeout(() => {
        if (onResolutionSuccess) {
          onResolutionSuccess()
        }
      }, RESOLUTION_SUCCESS_DELAY)
    }
  }, [finalizeSuccess, loadingToastId])

  const handlePropose = async () => {
    if (market.type === 'binary') {
      if (!actualPrice || parseFloat(actualPrice) < 0) {
        showErrorToast(new Error('Please enter a valid price'), 'Invalid Price')
        return
      }
      if (!proposeBinary) {
        showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
        return
      }
      const toastId = showLoadingToast('Proposing resolution...')
      setLoadingToastId(toastId)
      proposeBinary()
    } else {
      if (!proposeMulti) {
        showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
        return
      }
      const toastId = showLoadingToast('Proposing resolution...')
      setLoadingToastId(toastId)
      proposeMulti()
    }
  }

  const handleDispute = async () => {
    if (!dispute) {
      showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
      return
    }
    const toastId = showLoadingToast('Disputing resolution...')
    setLoadingToastId(toastId)
    dispute()
  }

  const handleVote = async (support: boolean) => {
    const voteFunc = support ? voteYes : voteNo
    if (!voteFunc) {
      showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
      return
    }
    const toastId = showLoadingToast(`Voting ${support ? 'YES' : 'NO'}...`)
    setLoadingToastId(toastId)
    voteFunc()
  }

  const handleFinalize = async () => {
    if (!finalize) {
      showErrorToast(new Error('Unable to prepare transaction'), 'Transaction error')
      return
    }
    const toastId = showLoadingToast('Finalizing resolution...')
    setLoadingToastId(toastId)
    finalize()
  }

  // If card is still active (not past deadline), show nothing
  const isPastDeadline = Date.now() / 1000 > market.timestamp
  if (!isPastDeadline || market.resolved) {
    return null
  }

  return (
    <Card className="premium-card">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Gavel className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Resolution</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 ${
          !hasProposal 
            ? 'bg-yellow-500/10 border border-yellow-500/20'
            : proposal?.disputed 
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-orange-500/10 border border-orange-500/20'
        }`}>
          <div className="flex items-start space-x-3">
            {!hasProposal ? (
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            ) : proposal?.disputed ? (
              <Vote className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">
                {!hasProposal 
                  ? 'Awaiting Resolution Proposal'
                  : proposal?.disputed
                  ? 'Resolution Disputed - Voting Active'
                  : 'Resolution Proposed - Challenge Period'}
              </p>
              <p className="text-xs text-white/60">
                {!hasProposal 
                  ? 'This market has passed its deadline. Anyone can propose the outcome.'
                  : proposal?.disputed
                  ? 'The community is voting on the proposed resolution.'
                  : 'The resolution can be challenged during this period.'}
              </p>
            </div>
          </div>
        </div>

        {/* Proposal Details */}
        {hasProposal && proposal && (
          <div className="glass rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Current Proposal
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Proposer</span>
                <span className="text-white font-mono text-xs">
                  {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                </span>
              </div>

              {market.type === 'binary' ? (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Proposed Price</span>
                  <span className="text-white font-medium">
                    {formatEther(proposal.proposedPrice)} TAO
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Winning Option</span>
                  <span className="text-white font-medium">
                    Option {Number(proposal.proposedOption) + 1}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-white/60">Bond Amount</span>
                <span className="text-white font-medium">
                  {formatEther(proposal.bondAmount)} TAO
                </span>
              </div>

              {proposal.disputed && (
                <>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Votes FOR</span>
                      <span className="text-green-400 font-medium">
                        {formatEther(proposal.yesVotes)} TAO
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/60">Votes AGAINST</span>
                      <span className="text-red-400 font-medium">
                        {formatEther(proposal.noVotes)} TAO
                      </span>
                    </div>
                  </div>

                  {/* Vote Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                    {Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 && (
                      <div 
                        className="bg-green-500 rounded-full h-2 transition-all duration-300"
                        style={{ 
                          width: `${(Number(proposal.yesVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100}%` 
                        }}
                      ></div>
                    )}
                  </div>
                </>
              )}

              {timeRemaining && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                  <span className="text-white/60 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Time Remaining
                  </span>
                  <span className="text-white font-medium">
                    {formatTimeRemaining(timeRemaining.seconds)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NO PROPOSAL YET - Show Propose Form */}
        {!hasProposal && (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-3 block font-medium">
                  {market.type === 'binary' ? 'Actual Price at Deadline' : 'Select Winning Option'}
                </label>
                
                {market.type === 'binary' ? (
                  <>
                    <Input
                      type="number"
                      value={actualPrice}
                      onChange={(e) => setActualPrice(e.target.value)}
                      placeholder="Enter actual price in TAO"
                      className="bg-black/40 border-white/20 text-white text-lg placeholder:text-white/40 h-14 mb-2"
                      step="0.01"
                      min="0"
                    />
                    <div className="flex items-start space-x-2 p-3 bg-blue-500/10 rounded-lg">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-200">
                        Enter the actual price of the asset at the deadline. Market resolves to YES if actual price ≥ {market.bettedAlphaPrice} TAO.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {market.optionNames?.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedOption(index)}
                        className={`py-3 px-4 rounded-xl text-base font-medium transition-all ${
                          selectedOption === index
                            ? 'bg-white/20 text-white border-2 border-white/50'
                            : 'glass text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Option {index + 1}: {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Required Bond</span>
                  <span className="text-white font-bold">
                    {formatEther(resolutionBond || 0n)} TAO
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Bond will be returned if resolution is not disputed, or if you win the vote.
                </p>
              </div>
            </div>

            {!isConnected ? (
              isMounted && (
                <div className="pt-2">
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button 
                        onClick={openConnectModal}
                        className="w-full btn-primary h-14 text-base font-bold rounded-xl"
                      >
                        Connect Wallet to Propose
                      </Button>
                    )}
                  </ConnectButton.Custom>
                </div>
              )
            ) : (
              <Button 
                onClick={handlePropose}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black h-14 text-base font-bold rounded-xl"
                disabled={
                  isProposing || 
                  (market.type === 'binary' && (!actualPrice || parseFloat(actualPrice) < 0))
                }
              >
                {isProposing ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Proposing...</span>
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Propose Resolution ({formatEther(resolutionBond || 0n)} TAO)
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* PROPOSAL EXISTS - Show Actions */}
        {hasProposal && proposal && (
          <>
            {/* DISPUTE PERIOD - Not yet disputed */}
            {!proposal.disputed && timeRemaining && !timeRemaining.ended && (
              <>
                {!isConnected ? (
                  isMounted && (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <Button 
                          onClick={openConnectModal}
                          className="w-full btn-primary h-14 text-base font-bold rounded-xl"
                        >
                          Connect Wallet to Dispute
                        </Button>
                      )}
                    </ConnectButton.Custom>
                  )
                ) : (
                  <Button 
                    onClick={handleDispute}
                    className="w-full bg-red-500 hover:bg-red-600 text-white h-14 text-base font-bold rounded-xl"
                    disabled={isDisputing}
                  >
                    {isDisputing ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Disputing...</span>
                      </span>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Dispute Resolution ({formatEther(proposal.bondAmount)} TAO)
                      </>
                    )}
                  </Button>
                )}
                <div className="flex items-start space-x-2 p-3 bg-orange-500/10 rounded-lg">
                  <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-200">
                    If you believe this resolution is incorrect, you can challenge it by matching the bond.
                  </p>
                </div>
              </>
            )}

            {/* VOTING PERIOD - Disputed */}
            {proposal.disputed && proposal.votingActive && timeRemaining && !timeRemaining.ended && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {!isConnected ? (
                    <div className="col-span-2">
                      {isMounted && (
                        <ConnectButton.Custom>
                          {({ openConnectModal }) => (
                            <Button 
                              onClick={openConnectModal}
                              className="w-full btn-primary h-14 text-base font-bold rounded-xl"
                            >
                              Connect Wallet to Vote
                            </Button>
                          )}
                        </ConnectButton.Custom>
                      )}
                    </div>
                  ) : (
                    <>
                      <Button 
                        onClick={() => handleVote(true)}
                        className="bg-green-500 hover:bg-green-600 text-white h-14 text-base font-bold rounded-xl"
                        disabled={isVoting}
                      >
                        {isVotingYes ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Support
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => handleVote(false)}
                        className="bg-red-500 hover:bg-red-600 text-white h-14 text-base font-bold rounded-xl"
                        disabled={isVoting}
                      >
                        {isVotingNo ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-start space-x-2 p-3 bg-blue-500/10 rounded-lg">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200">
                    Your voting power is based on your shares in this market. Vote to support or reject the proposal.
                  </p>
                </div>
              </>
            )}

            {/* FINALIZE - Periods ended */}
            {timeRemaining && timeRemaining.ended && (
              <>
                {!isConnected ? (
                  isMounted && (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <Button 
                          onClick={openConnectModal}
                          className="w-full btn-primary h-14 text-base font-bold rounded-xl"
                        >
                          Connect Wallet to Finalize
                        </Button>
                      )}
                    </ConnectButton.Custom>
                  )
                ) : (
                  <Button 
                    onClick={handleFinalize}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white h-14 text-base font-bold rounded-xl"
                    disabled={isFinalizing}
                  >
                    {isFinalizing ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Finalizing...</span>
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalize Resolution
                      </>
                    )}
                  </Button>
                )}
                <div className="flex items-start space-x-2 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-200">
                    The challenge/voting period has ended. Anyone can finalize the resolution now.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* Info Section */}
        <div className="glass rounded-lg p-4 space-y-2 border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold text-white mb-2">How Resolution Works</h4>
          <div className="space-y-1 text-xs text-white/60">
            <p>• Anyone can propose the outcome by posting a bond</p>
            <p>• {disputePeriod ? `${Number(disputePeriod) / 3600}h` : '48h'} challenge period for disputes</p>
            <p>• If disputed, community votes based on their market shares</p>
            <p>• Winner of the vote receives all bonds</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

