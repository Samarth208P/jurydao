import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { ArrowLeft, ThumbsUp, ThumbsDown, Users, Clock, User, CheckCircle } from 'lucide-react'
import { formatAddress, formatDate, formatTimeLeft, formatProposalState, calculatePercentage } from '../utils/format'
import { STATE_COLORS, PROPOSAL_STATES } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const ProposalDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { account } = useWallet()

    const [proposal, setProposal] = useState(null)
    const [jurors, setJurors] = useState([])
    const [loading, setLoading] = useState(true)
    const [voting, setVoting] = useState(false)
    const [executing, setExecuting] = useState(false)
    const [isSelectedJuror, setIsSelectedJuror] = useState(false)
    const [hasVoted, setHasVoted] = useState(false)
    const [showVoteModal, setShowVoteModal] = useState(false)
    const [voteChoice, setVoteChoice] = useState(null)

    const governor = useContract('governor')

    useEffect(() => {
        fetchProposal()
    }, [id, governor, account])

    const fetchProposal = async () => {
        if (!governor) return

        try {
            console.log('📥 Fetching proposal', id)
            const data = await governor.getProposal(id)
            const jurorsList = await governor.getJurors(id)

            const proposalData = {
                id,
                title: data[0],
                description: data[1],
                proposer: data[2],
                forVotes: data[3],
                againstVotes: data[4],
                deadline: data[5],
                state: data[6],
                jurySize: data[7],
            }

            setProposal(proposalData)
            setJurors(jurorsList)

            if (account) {
                const isJuror = jurorsList.some(j => j.toLowerCase() === account.toLowerCase())
                setIsSelectedJuror(isJuror)

                if (isJuror) {
                    try {
                        const voted = await governor.hasVoted(id, account)
                        setHasVoted(voted)
                        console.log('✅ Has voted:', voted)
                    } catch (error) {
                        console.error('Error checking vote status:', error)
                        setHasVoted(false)
                    }
                }
            }

            console.log('✅ Proposal loaded')
        } catch (error) {
            console.error('Fetch proposal error:', error.message)
            toast.error('Failed to load proposal')
        } finally {
            setLoading(false)
        }
    }


    const handleVote = async (support) => {
        if (!governor) return

        setVoting(true)
        try {
            console.log('🗳️ Voting:', support ? 'For' : 'Against')
            const tx = await governor.vote(id, support)
            toast.loading('Submitting vote...', { id: 'vote' })
            await tx.wait()

            toast.success('Vote submitted!', { id: 'vote' })
            console.log('✅ Vote successful')
            setShowVoteModal(false)
            fetchProposal()
        } catch (error) {
            console.error('Vote error:', error)
            toast.error('Vote failed', { id: 'vote' })
        } finally {
            setVoting(false)
        }
    }

    const handleExecute = async () => {
        if (!governor) return

        setExecuting(true)
        try {
            console.log('⚙️ Executing proposal...')
            const tx = await governor.execute(id)
            toast.loading('Executing proposal...', { id: 'execute' })
            await tx.wait()

            toast.success('Proposal executed!', { id: 'execute' })
            console.log('✅ Execution successful')
            fetchProposal()
        } catch (error) {
            console.error('Execute error:', error)
            toast.error('Execution failed', { id: 'execute' })
        } finally {
            setExecuting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading proposal..." />
            </div>
        )
    }

    if (!proposal) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Proposal Not Found</h2>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes)
    const forPercentage = calculatePercentage(Number(proposal.forVotes), totalVotes)
    const canVote = isSelectedJuror && !hasVoted && proposal.state === PROPOSAL_STATES.ACTIVE
    const canExecute = proposal.state === PROPOSAL_STATES.ACTIVE && Date.now() / 1000 >= Number(proposal.deadline)

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-100 mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Proposals
                    </button>

                    {/* Header */}
                    <div className="card mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-3xl font-bold flex-1">{proposal.title}</h1>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${STATE_COLORS[proposal.state]}`}>
                {formatProposalState(proposal.state)}
              </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>By {formatAddress(proposal.proposer)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>
                  {proposal.state === PROPOSAL_STATES.ACTIVE
                      ? `Ends in ${formatTimeLeft(proposal.deadline)}`
                      : formatDate(proposal.deadline)}
                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{proposal.jurySize} Jurors</span>
                            </div>
                        </div>

                        <p className="text-gray-300 whitespace-pre-wrap">{proposal.description}</p>
                    </div>

                    {/* Voting Results */}
                    <div className="card mb-6">
                        <h2 className="text-xl font-bold mb-4">Voting Results</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="card bg-green-500/5 border-green-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <ThumbsUp size={20} className="text-green-500" />
                                    <span className="font-semibold">For</span>
                                </div>
                                <div className="text-3xl font-bold text-green-500">{proposal.forVotes.toString()}</div>
                            </div>
                            <div className="card bg-red-500/5 border-red-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <ThumbsDown size={20} className="text-red-500" />
                                    <span className="font-semibold">Against</span>
                                </div>
                                <div className="text-3xl font-bold text-red-500">{proposal.againstVotes.toString()}</div>
                            </div>
                        </div>

                        {totalVotes > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-400">{forPercentage}% For</span>
                                    <span className="text-red-400">{100 - forPercentage}% Against</span>
                                </div>
                                <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                        style={{ width: `${forPercentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Jurors */}
                    <div className="card mb-6">
                        <h2 className="text-xl font-bold mb-4">Selected Jurors ({jurors.length})</h2>
                        {jurors.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Waiting for jury selection...</p>
                        ) : (
                            <div className="grid gap-2">
                                {jurors.map((juror, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                                            juror.toLowerCase() === account?.toLowerCase()
                                                ? 'bg-accent-blue/10 border-accent-blue/30'
                                                : 'bg-dark-bg border-dark-border'
                                        }`}
                                    >
                                        <Users size={16} className="text-gray-500" />
                                        <span className="font-mono text-sm">{formatAddress(juror)}</span>
                                        {juror.toLowerCase() === account?.toLowerCase() && (
                                            <span className="ml-auto text-xs bg-accent-blue px-2 py-1 rounded">You</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {canVote && (
                            <>
                                <button
                                    onClick={() => {
                                        setVoteChoice(true)
                                        setShowVoteModal(true)
                                    }}
                                    className="btn btn-primary flex-1"
                                >
                                    <ThumbsUp size={20} />
                                    Vote For
                                </button>
                                <button
                                    onClick={() => {
                                        setVoteChoice(false)
                                        setShowVoteModal(true)
                                    }}
                                    className="btn btn-secondary flex-1"
                                >
                                    <ThumbsDown size={20} />
                                    Vote Against
                                </button>
                            </>
                        )}
                        {hasVoted && (
                            <div className="card bg-green-500/5 border-green-500/20 text-center py-4">
                                <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                                <p className="font-semibold text-green-500">You've already voted</p>
                            </div>
                        )}
                        {canExecute && (
                            <button
                                onClick={handleExecute}
                                disabled={executing}
                                className="btn btn-primary w-full"
                            >
                                {executing ? (
                                    <>
                                        <span className="spinner"></span>
                                        Executing...
                                    </>
                                ) : (
                                    'Execute Proposal'
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Vote Confirmation Modal */}
            <Modal
                isOpen={showVoteModal}
                onClose={() => setShowVoteModal(false)}
                title="Confirm Vote"
            >
                <div className="text-center py-4">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                        voteChoice ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                        {voteChoice ? (
                            <ThumbsUp size={32} className="text-green-500" />
                        ) : (
                            <ThumbsDown size={32} className="text-red-500" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                        Vote {voteChoice ? 'For' : 'Against'}?
                    </h3>
                    <p className="text-gray-400 mb-6">This action cannot be undone</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowVoteModal(false)}
                            className="btn btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleVote(voteChoice)}
                            disabled={voting}
                            className="btn btn-primary flex-1"
                        >
                            {voting ? (
                                <>
                                    <span className="spinner"></span>
                                    Voting...
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ProposalDetail
