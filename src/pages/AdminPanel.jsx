import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { DollarSign, TrendingUp, Shield, Wallet, AlertCircle, Settings } from 'lucide-react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const AdminPanel = () => {
    const [balance, setBalance] = useState('0')
    const [gasRefundAmount, setGasRefundAmount] = useState('0')
    const [newGasRefund, setNewGasRefund] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [loading, setLoading] = useState(true)
    const [withdrawing, setWithdrawing] = useState(false)
    const [updating, setUpdating] = useState(false)

    const { account, isConnected, connectWallet, provider } = useWallet()
    const governor = useContract('governor')

    useEffect(() => {
        if (governor && account) {
            checkOwnership()
            fetchBalance()
            fetchGasRefundAmount()
        }
    }, [governor, account])

    const checkOwnership = async () => {
        if (!governor || !account) return

        try {
            const owner = await governor.owner()
            const isOwnerResult = owner.toLowerCase() === account.toLowerCase()
            setIsOwner(isOwnerResult)
        } catch (error) {
            // Silent error
        } finally {
            setLoading(false)
        }
    }

    const fetchBalance = async () => {
        if (!governor || !provider) return

        try {
            const contractAddress = await governor.getAddress()
            const balance = await provider.getBalance(contractAddress)
            const balanceInEth = ethers.formatEther(balance)
            setBalance(balanceInEth)
        } catch (error) {
            // Silent error
        }
    }

    const fetchGasRefundAmount = async () => {
        if (!governor) return

        try {
            const amount = await governor.gasRefundAmount()
            setGasRefundAmount(ethers.formatEther(amount))
        } catch (error) {
            // Silent error
        }
    }

    const handleWithdraw = async () => {
        if (!governor) {
            toast.error('Contract not loaded')
            return
        }

        setWithdrawing(true)

        try {
            const tx = await governor.withdrawUnusedFees()
            toast.loading('Withdrawing unused fees...', { id: 'withdraw' })
            await tx.wait()

            toast.success('Successfully withdrew unused fees', { id: 'withdraw' })

            // Refresh balance
            fetchBalance()
        } catch (error) {
            toast.error(error.reason || 'Failed to withdraw', { id: 'withdraw' })
        } finally {
            setWithdrawing(false)
        }
    }

    const handleUpdateGasRefund = async () => {
        if (!governor || !newGasRefund) {
            toast.error('Please enter a gas refund amount')
            return
        }

        const amount = parseFloat(newGasRefund)
        if (amount < 0) {
            toast.error('Amount must be positive')
            return
        }

        setUpdating(true)

        try {
            const amountInWei = ethers.parseEther(newGasRefund)
            const tx = await governor.setGasRefundAmount(amountInWei)

            toast.loading('Updating gas refund amount...', { id: 'update' })
            await tx.wait()

            toast.success(`Gas refund updated to ${amount} ETH`, { id: 'update' })

            // Refresh gas refund amount
            fetchGasRefundAmount()
            setNewGasRefund('')
        } catch (error) {
            toast.error(error.reason || 'Failed to update', { id: 'update' })
        } finally {
            setUpdating(false)
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
                    <Shield size={48} className="mx-auto mb-4 text-accent-blue" />
                    <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to access admin functions</p>
                    <button onClick={connectWallet} className="btn btn-primary w-full">
                        Connect Wallet
                    </button>
                </motion.div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card max-w-md w-full text-center p-8 bg-red-500/5 border-red-500/20"
                >
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-400">You are not the contract owner</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
                    <p className="text-gray-400 mb-8">Manage contract funds and settings</p>

                    {/* Stats */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-400">Contract Balance</span>
                                <DollarSign className="text-green-400" size={20} />
                            </div>
                            <div className="text-3xl font-bold text-green-400">
                                {parseFloat(balance).toFixed(4)} ETH
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="card"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-400">Gas Refund/Vote</span>
                                <TrendingUp className="text-blue-400" size={20} />
                            </div>
                            <div className="text-2xl font-bold text-blue-400">
                                {parseFloat(gasRefundAmount).toFixed(4)} ETH
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="card"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-400">Admin Status</span>
                                <Shield className="text-purple-400" size={20} />
                            </div>
                            <div className="text-lg font-bold text-purple-400">Owner</div>
                        </motion.div>
                    </div>

                    {/* Withdraw Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card mb-6"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Wallet size={24} />
                            Withdraw Unused Fees
                        </h2>

                        <div className="card bg-blue-500/5 border-blue-500/20 mb-6">
                            <p className="text-sm text-gray-400">
                                <strong className="text-blue-400">Info:</strong> Withdraw all unused ETH from the contract.
                                This includes unspent gas sponsorship funds from proposals that didn't fully utilize their allocated fees.
                            </p>
                        </div>

                        <div className="mb-4">
                            <p className="text-gray-400 mb-2">
                                Available Balance: <strong className="text-white">{parseFloat(balance).toFixed(6)} ETH</strong>
                            </p>
                        </div>

                        <button
                            onClick={handleWithdraw}
                            disabled={withdrawing || parseFloat(balance) === 0}
                            className="btn btn-primary w-full"
                        >
                            {withdrawing ? (
                                <>
                                    <span className="spinner"></span>
                                    Withdrawing...
                                </>
                            ) : (
                                <>
                                    <DollarSign size={20} />
                                    Withdraw All Unused Fees
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* Gas Refund Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Settings size={24} />
                            Gas Refund Settings
                        </h2>

                        <div className="card bg-purple-500/5 border-purple-500/20 mb-6">
                            <p className="text-sm text-gray-400">
                                <strong className="text-purple-400">Current Setting:</strong> Each juror receives{' '}
                                <strong className="text-white">{parseFloat(gasRefundAmount).toFixed(4)} ETH</strong> as a gas refund when they vote.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">New Gas Refund Amount (ETH)</label>
                            <input
                                type="number"
                                value={newGasRefund}
                                onChange={(e) => setNewGasRefund(e.target.value)}
                                placeholder="0.001"
                                step="0.0001"
                                min="0"
                                className="input"
                            />
                            <p className="text-sm text-gray-400 mt-2">
                                Recommended: 0.001 - 0.005 ETH per vote
                            </p>
                        </div>

                        <button
                            onClick={handleUpdateGasRefund}
                            disabled={updating || !newGasRefund}
                            className="btn btn-primary w-full"
                        >
                            {updating ? (
                                <>
                                    <span className="spinner"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Settings size={20} />
                                    Update Gas Refund
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* Warning */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="card bg-yellow-500/5 border-yellow-500/20 mt-6"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-yellow-500 mb-1">Important</p>
                                <p className="text-sm text-gray-400">
                                    The <strong>withdrawUnusedFees()</strong> function only withdraws fees that are not reserved for active proposals.
                                    Changing gas refund amounts will only affect new proposals created after the update.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default AdminPanel
