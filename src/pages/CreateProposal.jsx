import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { FileText, Users, AlertCircle } from 'lucide-react'
import { JURY_SIZES } from '../utils/constants'
import { validateProposalInput } from '../utils/helpers'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const CreateProposal = () => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [jurySize, setJurySize] = useState(3)
    const [jurorCount, setJurorCount] = useState(0)
    const [creating, setCreating] = useState(false)

    const navigate = useNavigate()
    const { isConnected, connectWallet } = useWallet()
    const governor = useContract('governor')
    const registry = useContract('registry')

    useEffect(() => {
        fetchJurorCount()
    }, [registry])

    const fetchJurorCount = async () => {
        if (!registry) return
        try {
            const count = await registry.getJurorCount()
            setJurorCount(Number(count))
            console.log('👥 Registered jurors:', Number(count))
        } catch (error) {
            console.error('Error fetching juror count:', error.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const error = validateProposalInput(title, description)
        if (error) {
            toast.error(error)
            return
        }

        if (!governor) {
            toast.error('Contract not loaded')
            return
        }

        setCreating(true)
        try {
            console.log('📝 Creating proposal...')

            // Send 0.001 ETH - contract will use exact fee and auto-refund excess
            const tx = await governor.propose(title, description, jurySize, {
                value: ethers.parseEther('0.001'),
            })

            toast.loading('Creating proposal...', { id: 'create' })
            await tx.wait()

            console.log('✅ Proposal created!')
            toast.success('Proposal created! Waiting for jury selection...', { id: 'create' })

            setTimeout(() => navigate('/dashboard'), 2000)
        } catch (error) {
            console.error('Create proposal error:', error)
            const errorMsg = error.message.includes('No jurors')
                ? 'No jurors registered. Register as a juror first!'
                : error.message.includes('Insufficient fee')
                    ? 'Insufficient fee for randomness'
                    : 'Failed to create proposal'
            toast.error(errorMsg, { id: 'create' })
        } finally {
            setCreating(false)
        }
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card max-w-md w-full text-center p-8"
                >
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to create a proposal</p>
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
                    <p className="text-gray-400 mb-8">Submit a new proposal for community voting</p>

                    {jurorCount === 0 && (
                        <div className="card bg-yellow-500/5 border-yellow-500/20 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-yellow-500 mb-1">No Jurors Registered</p>
                                    <p className="text-sm text-gray-400">
                                        Register as a juror first to enable proposal creation.{' '}
                                        <a href="/juror" className="text-yellow-500 hover:underline">
                                            Register here →
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="card">
                        {/* Title */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                <FileText size={18} />
                                Proposal Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Reduce Minimum Juror Stake to 50 DGOV"
                                className="input"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide detailed information about your proposal..."
                                rows="6"
                                className="input resize-none"
                                required
                            />
                        </div>

                        {/* Jury Size */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                <Users size={18} />
                                Jury Size ({jurorCount} jurors available)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {JURY_SIZES.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setJurySize(option.value)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                                            jurySize === option.value
                                                ? 'border-accent-blue bg-accent-blue/10'
                                                : 'border-dark-border hover:border-accent-blue/50'
                                        }`}
                                    >
                                        <div className="font-semibold mb-1">{option.label}</div>
                                        <div className="text-sm text-gray-400">{option.description}</div>
                                    </button>
                                ))}
                            </div>
                            {jurySize > jurorCount && jurorCount > 0 && (
                                <p className="text-sm text-yellow-500 mt-2">
                                    ⚠️ Only {jurorCount} juror(s) available. Will auto-adjust to {jurorCount}.
                                </p>
                            )}
                        </div>

                        {/* Info */}
                        <div className="card bg-blue-500/5 border-blue-500/20 mb-6">
                            <p className="text-sm text-gray-400">
                                <strong className="text-blue-400">Note:</strong> Creating a proposal requires{' '}
                                <strong>~0.001 ETH</strong> for Pyth Entropy randomness. Any excess will be refunded automatically. Jurors will be randomly selected within 1-2 minutes.
                            </p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={creating || jurorCount === 0}
                            className="btn btn-primary w-full"
                        >
                            {creating ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                'Create Proposal'
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default CreateProposal
