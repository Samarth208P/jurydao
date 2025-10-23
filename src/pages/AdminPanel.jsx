import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { DollarSign, TrendingUp, Shield, Wallet } from 'lucide-react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const AdminPanel = () => {
    const [balance, setBalance] = useState('0')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [loading, setLoading] = useState(true)
    const [withdrawing, setWithdrawing] = useState(false)

    const { account, isConnected, connectWallet } = useWallet()
    const governor = useContract('governor')

    useEffect(() => {
        checkOwnership()
        fetchBalance()
    }, [governor, account])

    const checkOwnership = async () => {
        if (!governor || !account) return

        try {
            const owner = await governor.owner()
            setIsOwner(owner.toLowerCase() === account.toLowerCase())
            console.log('🔐 Is owner:', owner.toLowerCase() === account.toLowerCase())
        } catch (error) {
            console.error('Error checking ownership:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchBalance = async () => {
        if (!governor) return

        try {
            const bal = await governor.getBalance()
            setBalance(ethers.formatEther(bal))
            console.log('💰 Contract balance:', ethers.formatEther(bal), 'ETH')
        } catch (error) {
            console.error('Error fetching balance:', error)
        }
    }

    const handleWithdraw = async () => {
        if (!governor || !withdrawAmount) return

        try {
            const amount = ethers.parseEther(withdrawAmount)
            setWithdrawing(true)

            console.log('💸 Withdrawing:', withdrawAmount, 'ETH')
            const tx = await governor.withdraw(amount)
            toast.loading('Withdrawing...', { id: 'withdraw' })
            await tx.wait()

            toast.success(`Withdrew ${withdrawAmount} ETH!`, { id: 'withdraw' })
            setWithdrawAmount('')
            fetchBalance()
        } catch (error) {
            console.error('Withdraw error:', error)
            toast.error('Withdrawal failed', { id: 'withdraw' })
        } finally {
            setWithdrawing(false)
        }
    }

    const handleWithdrawAll = async () => {
        if (!governor) return

        try {
            setWithdrawing(true)
            console.log('💸 Withdrawing all ETH')
            const tx = await governor.withdrawAll()
            toast.loading('Withdrawing all...', { id: 'withdraw' })
            await tx.wait()

            toast.success('Withdrew all ETH!', { id: 'withdraw' })
            fetchBalance()
        } catch (error) {
            console.error('Withdraw all error:', error)
            toast.error('Withdrawal failed', { id: 'withdraw' })
        } finally {
            setWithdrawing(false)
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
                    <Shield size={64} className="mx-auto mb-4 text-accent-blue" />
                    <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to access the admin panel</p>
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
                <div className="text-center">
                    <div className="spinner mb-4"></div>
                    <p className="text-gray-400">Checking admin access...</p>
                </div>
            </div>
        )
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card max-w-md w-full text-center p-8"
                >
                    <Shield size={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-400 mb-6">
                        You don't have admin privileges for this contract
                    </p>
                    <p className="text-sm text-gray-500">
                        Connected as: <span className="font-mono">{account?.slice(0, 10)}...</span>
                    </p>
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
                    <div className="flex items-center gap-3 mb-2">
                        <Shield size={32} className="text-accent-blue" />
                        <h1 className="text-4xl font-bold">Admin Panel</h1>
                    </div>
                    <p className="text-gray-400 mb-8">Manage contract funds and settings</p>

                    {/* Balance Card */}
                    <div className="card mb-6 bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border-accent-blue/30">
                        <div className="flex items-center gap-3 mb-4">
                            <Wallet size={24} className="text-accent-blue" />
                            <h2 className="text-2xl font-bold">Contract Balance</h2>
                        </div>
                        <div className="text-5xl font-bold mb-2">
                            {parseFloat(balance).toFixed(6)} ETH
                        </div>
                        <p className="text-sm text-gray-400">
                            Accumulated fees from proposal creation
                        </p>
                    </div>

                    {/* Withdraw Section */}
                    <div className="card mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <DollarSign size={24} className="text-green-500" />
                            <h2 className="text-2xl font-bold">Withdraw Funds</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Partial Withdrawal */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Withdraw Amount (ETH)
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.001"
                                        step="0.000001"
                                        min="0"
                                        max={balance}
                                        className="input flex-1"
                                    />
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                        className="btn btn-primary"
                                    >
                                        {withdrawing ? 'Withdrawing...' : 'Withdraw'}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Available: {parseFloat(balance).toFixed(6)} ETH
                                </p>
                            </div>

                            {/* Withdraw All */}
                            <div className="pt-4 border-t border-dark-border">
                                <button
                                    onClick={handleWithdrawAll}
                                    disabled={withdrawing || parseFloat(balance) <= 0}
                                    className="btn btn-secondary w-full"
                                >
                                    <TrendingUp size={20} />
                                    Withdraw All ({parseFloat(balance).toFixed(6)} ETH)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="card bg-yellow-500/5 border-yellow-500/20">
                        <p className="text-sm text-gray-400">
                            <strong className="text-yellow-500">Note:</strong> Withdrawn funds will be sent to your connected wallet address.
                            Make sure you're connected with the correct admin account.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default AdminPanel
