import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { FileText, Users, AlertCircle } from 'lucide-react'
import { JURY_SIZES } from '../utils/constants'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import ExplorerLink from '../components/ExplorerLink'

const CreateProposal = () => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [jurySize, setJurySize] = useState(1)
    const [jurorCount, setJurorCount] = useState(0)
    const [creating, setCreating] = useState(false)
    const [txHash, setTxHash] = useState(null)

    const navigate = useNavigate()
    const { isConnected, connectWallet, chainId } = useWallet()
    const governor = useContract('governor')
    const registry = useContract('registry')

    useEffect(() => {
        fetchJurorCount()
    }, [registry])

    const fetchJurorCount = async () => {
        if (!registry) return
        try {
            const count = await registry.getJurorCount()
            const total = Number(count)
            setJurorCount(total)

            // Auto-select appropriate jury size
            if (total === 1) setJurySize(1)
            else if (total >= 3) setJurySize(3)
            else setJurySize(total || 1)

            console.log('👥 Registered jurors:', total)
        } catch (error) {
            console.error('Error fetching juror count:', error)
        }
    }

    const validateInput = () => {
        if (!title.trim()) {
            toast.error('Please enter a title')
            return false
        }
        if (!description.trim()) {
            toast.error('Please enter a description')
            return false
        }
        if (jurorCount === 0) {
            toast.error('No jurors registered. Please register as a juror first.')
            return false
        }
        return true
    }

    const handleCreate = async () => {
        if (!governor) {
            toast.error('Governor contract not connected')
            return
        }

        if (!validateInput()) return

        setCreating(true)
        try {
            console.log('📝 Creating proposal...', { title, jurySize, jurorCount })

            // Fixed fee for Pyth (0.001 ETH)
            const fee = ethers.parseEther('0.001')

            const tx = await governor.propose(title, description, jurySize, {
                value: fee
            })

            setTxHash(tx.hash)
            toast.loading('Creating proposal...', { id: 'create' })
            console.log('📤 Transaction hash:', tx.hash)

            const receipt = await tx.wait()

            // Extract proposal ID from events
            let proposalId = 0
            for (const log of receipt.logs) {
                try {
                    const parsed = governor.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    })
                    if (parsed && parsed.name === 'ProposalCreated') {
                        proposalId = Number(parsed.args[0])
                        break
                    }
                } catch (e) {
                    continue
                }
            }

            // Store creation transaction
            localStorage.setItem(`proposal_${proposalId}_tx`, tx.hash)

            toast.success('Proposal created successfully!', { id: 'create' })
            console.log('✅ Proposal created with ID:', proposalId)

            setTimeout(() => {
                navigate(`/proposal/${proposalId}`)
            }, 1500)
        } catch (error) {
            console.error('Create proposal error:', error)
            const errorMsg = error.reason || error.message || 'Failed to create proposal'
            toast.error(errorMsg, { id: 'create' })
        } finally {
            setCreating(false)
        }
    }

    // Only disable if no jurors at all OR missing title/description
    const isButtonDisabled = creating || !title || !description || jurorCount === 0

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card max-w-md w-full text-center p-8"
                >
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to create proposals</p>
                    <button onClick={connectWallet} className="btn btn-primary w-full">
                        Connect Wallet
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-bold mb-2">Create Proposal</h1>
                    <p className="text-gray-400 mb-8">
                        Submit a new governance proposal for community voting
                    </p>

                    <div className="card">
                        {/* Title */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                <FileText size={16} className="inline mr-1" />
                                Proposal Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input"
                                placeholder="Enter a clear, concise title"
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {title.length}/200 characters
                            </p>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input min-h-[200px]"
                                placeholder="Provide detailed information about your proposal..."
                                maxLength={2000}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {description.length}/2000 characters
                            </p>
                        </div>

                        {/* Jury Size */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                <Users size={16} className="inline mr-1" />
                                Jury Size
                            </label>
                            <select
                                value={jurySize}
                                onChange={(e) => setJurySize(Number(e.target.value))}
                                className="input w-full"
                                disabled={jurorCount === 0}
                            >
                                {jurorCount === 0 ? (
                                    <option value={0}>No jurors registered</option>
                                ) : (
                                    JURY_SIZES.map(size => (
                                        <option key={size} value={size}>
                                            {size} juror{size > 1 ? 's' : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {jurorCount} juror{jurorCount !== 1 ? 's' : ''} currently registered
                            </p>
                        </div>

                        {/* Warning for insufficient jurors (but still allow) */}
                        {jurorCount > 0 && jurySize > jurorCount && (
                            <div className="card bg-yellow-500/5 border-yellow-500/20 mb-6">
                                <div className="flex gap-3">
                                    <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-yellow-400 mb-1">⚠️ Warning: Insufficient Jurors</p>
                                        <p className="text-gray-400 mb-2">
                                            You selected {jurySize} jurors but only {jurorCount} {jurorCount === 1 ? 'is' : 'are'} registered.
                                            The system will select all {jurorCount} available juror{jurorCount === 1 ? '' : 's'}.
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            You can still create this proposal, but consider registering more jurors for better decentralization.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fatal error - no jurors */}
                        {jurorCount === 0 && (
                            <div className="card bg-red-500/5 border-red-500/20 mb-6">
                                <div className="flex gap-3">
                                    <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-red-400 mb-1">❌ No Jurors Registered</p>
                                        <p className="text-gray-400 mb-2">
                                            You must register at least one juror before creating proposals.
                                        </p>
                                        <a href="/juror" className="text-accent-blue hover:underline">
                                            Register as Juror →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        {jurorCount > 0 && (
                            <div className="card bg-blue-500/5 border-blue-500/20 mb-6">
                                <div className="flex gap-3">
                                    <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-gray-300">
                                        <p className="font-semibold text-blue-400 mb-2">How it works:</p>
                                        <ul className="space-y-1 text-gray-400">
                                            <li>• Your proposal will be submitted to the blockchain</li>
                                            <li>• Pyth Entropy will randomly select up to {jurySize} juror{jurySize > 1 ? 's' : ''} from {jurorCount} available</li>
                                            <li>• Selected jurors will vote over a 7-day period</li>
                                            <li>• Requires ~0.001 ETH fee for Pyth randomness</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transaction Link */}
                        {txHash && (
                            <div className="card bg-green-500/5 border-green-500/20 mb-6">
                                <p className="text-sm mb-2 text-green-400 font-semibold">Transaction submitted:</p>
                                <ExplorerLink type="tx" value={txHash} chainId={chainId}>
                                    View on Block Explorer
                                </ExplorerLink>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleCreate}
                            disabled={isButtonDisabled}
                            className={`btn btn-primary w-full ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {creating ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating Proposal...
                                </>
                            ) : jurorCount === 0 ? (
                                'Register Jurors First'
                            ) : (
                                'Create Proposal'
                            )}
                        </button>

                        {/* Additional note under button if insufficient */}
                        {jurorCount > 0 && jurySize > jurorCount && (
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Will select all {jurorCount} available juror{jurorCount === 1 ? '' : 's'} instead of {jurySize}
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default CreateProposal
