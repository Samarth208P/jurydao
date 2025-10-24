import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { ArrowLeft, Send, AlertCircle, FileText, Users, Calendar, DollarSign, Zap, CheckCircle2 } from 'lucide-react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const CreateProposal = () => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [jurySize, setJurySize] = useState(0)
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('10:00')
    const [sponsorFees, setSponsorFees] = useState(true)
    const [jurorCount, setJurorCount] = useState(0)
    const [gasRefundAmount, setGasRefundAmount] = useState('0.001')
    const [entropyFee, setEntropyFee] = useState('0.001')
    const [creating, setCreating] = useState(false)
    const [loadingFees, setLoadingFees] = useState(true)

    const navigate = useNavigate()
    const { account, isConnected, connectWallet } = useWallet()
    const governor = useContract('governor')
    const registry = useContract('jurorRegistry')

    useEffect(() => {
        fetchJurorCount()
        fetchContractFees()
    }, [registry, governor])

    useEffect(() => {
        const defaultDate = new Date()
        defaultDate.setDate(defaultDate.getDate() + 7)
        setSelectedDate(defaultDate.toISOString().split('T')[0])
    }, [])

    useEffect(() => {
        if (jurorCount > 0 && jurySize === 0) {
            setJurySize(Math.min(jurorCount, 5)) // Default to 5 or max available
        }
    }, [jurorCount])

    const fetchJurorCount = async () => {
        if (!registry) return

        try {
            const count = await registry.getJurorCount()
            setJurorCount(Number(count))
        } catch (error) {
            // Silent error
        }
    }

    const fetchContractFees = async () => {
        if (!governor) return

        setLoadingFees(true)
        try {
            // Get gas refund amount from contract
            const gasRefund = await governor.gasRefundAmount()
            setGasRefundAmount(ethers.formatEther(gasRefund))

            // Get entropy fee from contract (if available)
            try {
                const entropy = await governor.getEntropyFee()
                setEntropyFee(ethers.formatEther(entropy))
            } catch {
                setEntropyFee('0.001')
            }
        } catch (error) {
            // Use defaults if fetch fails
            setGasRefundAmount('0.001')
            setEntropyFee('0.001')
        } finally {
            setLoadingFees(false)
        }
    }

    const getDeadlineTimestamp = () => {
        if (!selectedDate || !selectedTime) return null
        return new Date(`${selectedDate}T${selectedTime}`).getTime()
    }

    const getFormattedDeadline = () => {
        const timestamp = getDeadlineTimestamp()
        if (!timestamp) return ''

        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const getRelativeTime = () => {
        const timestamp = getDeadlineTimestamp()
        if (!timestamp) return ''

        const now = Date.now()
        const diff = timestamp - now

        if (diff < 0) return 'In the past'

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours}h` : ''}`
        }
        return `${hours} hour${hours > 1 ? 's' : ''}`
    }

    const calculateTotalCost = () => {
        // Base fee: 0.01 ETH (covers proposal creation + Pyth Entropy)
        const baseFee = 0.01
        const gasCost = sponsorFees ? (parseFloat(gasRefundAmount) * jurySize) : 0
        return (baseFee + gasCost).toFixed(4)
    }

    const getFeesBreakdown = () => {
        const baseFee = 0.01
        const gasCost = sponsorFees ? (parseFloat(gasRefundAmount) * jurySize) : 0
        const total = baseFee + gasCost

        return {
            base: baseFee,
            gas: gasCost,
            total
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!title.trim() || !description.trim()) {
            toast.error('Please fill in all fields')
            return
        }

        if (!governor) {
            toast.error('Contract not loaded. Please refresh.')
            return
        }

        if (jurorCount === 0) {
            toast.error('No jurors registered. Register as a juror first!')
            return
        }

        if (jurySize > jurorCount) {
            toast.error(`Only ${jurorCount} jurors available`)
            return
        }

        if (jurySize < 1) {
            toast.error('Jury size must be at least 1')
            return
        }

        if (!selectedDate || !selectedTime) {
            toast.error('Please select a deadline date and time')
            return
        }

        const deadlineTimestamp = Math.floor(getDeadlineTimestamp() / 1000)
        const now = Math.floor(Date.now() / 1000)

        if (deadlineTimestamp <= now) {
            toast.error('Deadline must be in the future')
            return
        }

        const votingPeriodSeconds = deadlineTimestamp - now

        // Check voting period constraints (from contract)
        const MIN_PERIOD = 1 * 60 * 60 // 1 hour
        const MAX_PERIOD = 30 * 24 * 60 * 60 // 30 days

        if (votingPeriodSeconds < MIN_PERIOD) {
            toast.error('Voting period must be at least 1 hour')
            return
        }

        if (votingPeriodSeconds > MAX_PERIOD) {
            toast.error('Voting period must be less than 30 days')
            return
        }

        setCreating(true)

        try {
            // Calculate required ETH: 0.01 base + gas sponsorship
            const requiredAmount = calculateTotalCost()
            const value = ethers.parseEther(requiredAmount)

            toast.loading('Creating proposal...', { id: 'create' })

            const tx = await governor.createProposal(
                title,
                description,
                jurySize,
                votingPeriodSeconds,
                sponsorFees,
                {
                    value, // Send ETH with transaction
                    gasLimit: 500000
                }
            )

            await tx.wait()

            toast.success('Proposal created successfully!', { id: 'create' })

            setTimeout(() => navigate('/dashboard'), 2000)
        } catch (error) {
            let errorMsg = 'Failed to create proposal'

            if (error.code === 'ACTION_REJECTED') {
                errorMsg = 'Transaction rejected'
            } else if (error.message?.includes('Jury size exceeds')) {
                errorMsg = `Only ${jurorCount} jurors available`
            } else if (error.message?.includes('Voting period too short')) {
                errorMsg = 'Voting period must be at least 1 hour'
            } else if (error.message?.includes('Voting period too long')) {
                errorMsg = 'Voting period must be less than 30 days'
            } else if (error.message?.includes('Insufficient') || error.message?.includes('insufficient funds')) {
                errorMsg = `Insufficient ETH. Need ${calculateTotalCost()} ETH`
            } else if (error.reason) {
                errorMsg = error.reason
            }

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
                    <AlertCircle size={48} className="mx-auto mb-4 text-blue-400" />
                    <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to create a proposal</p>
                    <button onClick={connectWallet} className="btn btn-primary w-full">
                        Connect Wallet
                    </button>
                </motion.div>
            </div>
        )
    }

    const fees = getFeesBreakdown()

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Create Proposal
                    </h1>
                    <p className="text-gray-400">Submit a new proposal for community voting</p>
                </motion.div>

                {/* No Jurors Warning */}
                {jurorCount === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card bg-yellow-500/5 border-yellow-500/20 mb-6"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-yellow-500 mb-1">No Jurors Registered</p>
                                <p className="text-sm text-gray-400">
                                    Register as a juror first to enable proposal creation.{' '}
                                    <a href="/juror" className="text-yellow-500 hover:underline">
                                        Register here
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Main Form Grid */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="grid lg:grid-cols-3 gap-6"
                >
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Proposal Details Card */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800/50">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <FileText size={20} className="text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold">Proposal Details</h2>
                            </div>

                            {/* Title */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Upgrade Smart Contract to v2.0"
                                    className="input"
                                    maxLength={100}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide detailed information about your proposal..."
                                    rows={8}
                                    className="input resize-none"
                                    maxLength={1000}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
                            </div>
                        </div>

                        {/* Voting Configuration Card */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800/50">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Users size={20} className="text-purple-400" />
                                </div>
                                <h2 className="text-xl font-bold">Voting Configuration</h2>
                            </div>

                            {/* Jury Size Slider */}
                            <div className="mb-6">
                                <label className="flex items-center justify-between text-sm font-semibold mb-3">
                                    <span>Number of Jurors</span>
                                    <span className="text-2xl font-bold text-blue-400">{jurySize}</span>
                                </label>
                                <p className="text-xs text-gray-400 mb-3">
                                    {jurorCount} jurors available
                                </p>
                                <input
                                    type="range"
                                    value={jurySize}
                                    onChange={(e) => setJurySize(Number(e.target.value))}
                                    min="1"
                                    max={jurorCount || 1}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    disabled={jurorCount === 0}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>1</span>
                                    <span>{jurorCount || 1}</span>
                                </div>
                            </div>

                            {/* Voting Deadline */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                                    <Calendar size={16} />
                                    Voting Deadline
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date Input */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-2 block">Date</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="input cursor-pointer"
                                            required
                                        />
                                    </div>

                                    {/* Time Input */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-2 block">Time</label>
                                        <input
                                            type="time"
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="input cursor-pointer"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Combined Display */}
                                {selectedDate && selectedTime && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center justify-between"
                                    >
                                        <div className="text-sm">
                                            <span className="text-gray-400">Ends: </span>
                                            <span className="text-gray-200 font-semibold">
                                                {getFormattedDeadline()}
                                            </span>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                                            <span className="text-xs font-bold text-blue-400">
                                                {getRelativeTime()}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary Sidebar */}
                    <div className="space-y-6">
                        {/* Gas Sponsorship Card */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800/50">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <Zap size={20} className="text-green-400" />
                                </div>
                                <h2 className="text-lg font-bold">Gas Fees</h2>
                            </div>

                            {/* Toggle */}
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 cursor-pointer hover:bg-blue-500/10 transition-all mb-4">
                                <input
                                    type="checkbox"
                                    checked={sponsorFees}
                                    onChange={(e) => setSponsorFees(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">Sponsor Gas Fees</div>
                                    <div className="text-xs text-gray-400">Pay for juror voting costs</div>
                                </div>
                            </label>

                            <p className="text-xs text-gray-400 p-3 rounded-lg bg-gray-900/50">
                                {sponsorFees
                                    ? `~${gasRefundAmount} ETH per juror (${jurySize} jurors)`
                                    : 'Jurors pay their own gas fees'
                                }
                            </p>
                        </div>

                        {/* Cost Summary Card */}
                        <div className="card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700/50">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <DollarSign size={20} className="text-blue-400" />
                                </div>
                                <h2 className="text-lg font-bold">Required Payment</h2>
                            </div>

                            {loadingFees ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="spinner"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Base + Entropy Fee:</span>
                                            <span className="font-semibold">{fees.base.toFixed(4)} ETH</span>
                                        </div>

                                        {sponsorFees && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">
                                                    Gas Refunds ({jurySize}):
                                                </span>
                                                <span className="font-semibold">{fees.gas.toFixed(4)} ETH</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-gray-700/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-400 font-bold">Total:</span>
                                                <span className="text-blue-400 font-bold text-2xl">
                                                    {fees.total.toFixed(4)} ETH
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 p-3 rounded-lg bg-gray-900/50">
                                        Required payment includes proposal creation and Pyth Entropy fees. Unspent gas refunds can be withdrawn by contract owner.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Info Card */}
                        <div className="card bg-purple-500/5 border-purple-500/20">
                            <div className="flex gap-3">
                                <CheckCircle2 className="text-purple-400 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-gray-400">
                                    <span className="text-purple-400 font-semibold">Random Selection:</span> Jurors will be randomly selected using Pyth Entropy within 1-2 minutes after proposal creation.
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={creating || jurorCount === 0 || loadingFees}
                            className="btn btn-primary w-full py-4 text-lg"
                        >
                            {creating ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Create Proposal
                                </>
                            )}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    )
}

export default CreateProposal
