import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { DollarSign, TrendingUp, Shield, Wallet, AlertCircle } from 'lucide-react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const AdminPanel = () => {
    const [balance, setBalance] = useState('0')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [loading, setLoading] = useState(true)
    const [withdrawing, setWithdrawing] = useState(false)

    const { account, isConnected, connectWallet, provider } = useWallet()
    const governor = useContract('governor')

    useEffect(() => {
        if (governor && account) {
            checkOwnership()
            fetchBalance()
        }
    }, [governor, account])

    const checkOwnership = async () => {
        if (!governor || !account) return

        try {
            const owner = await governor.owner()
            const isOwnerResult = owner.toLowerCase() === account.toLowerCase()
            setIsOwner(isOwnerResult)
            console.log('Is owner:', isOwnerResult)
        } catch (error) {
            console.error('Error checking ownership:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchBalance = async () => {
        if (!governor || !provider) return

        try {
            // Get contract address
            const contractAddress = await governor.getAddress()

            // Get ETH balance using provider
            const balance = await provider.getBalance(contractAddress)
            const balanceInEth = ethers.formatEther(balance)

            setBalance(balanceInEth)
            console.log('✅ Contract balance:', balanceInEth, 'ETH')
        } catch (error) {
            console.error('❌ Error fetching balance:', error.message)
        }
    }

    const handleWithdraw = async () => {
        if (!governor || !withdrawAmount) {
            toast.error('Please enter an amount')
            return
        }

        const amount = parseFloat(withdrawAmount)
        if (amount <= 0 || amount > parseFloat(balance)) {
            toast.error('Invalid amount')
            return
        }

        setWithdrawing(true)

        try {
            console.log('Withdrawing:', amount, 'ETH')

            const amountInWei = ethers.parseEther(withdrawAmount)
            const tx = await governor.withdraw(amountInWei)

            toast.loading('Withdrawing...', { id: 'withdraw' })
            await tx.wait()

            toast.success(`Successfully withdrew ${amount} ETH`, { id: 'withdraw' })
            console.log('✅ Withdrawal successful')

            // Refresh balance
            fetchBalance()
            setWithdrawAmount('')
        } catch (error) {
            console.error('❌ Withdraw error:', error)
            toast.error('Failed to withdraw', { id: 'withdraw' })
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
                                <span className="text-gray-400">Your Address</span>
                                <Wallet className="text-blue-400" size={20} />
                            </div>
                            <div className="text-sm font-mono">
                                {account?.slice(0, 10)}...{account?.slice(-8)}
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
                        className="card"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp size={24} />
                            Withdraw Funds
                        </h2>

                        <div className="card bg-blue-500/5 border-blue-500/20 mb-6">
                            <p className="text-sm text-gray-400">
                                <strong className="text-blue-400">Info:</strong> Withdraw ETH from the contract to your
                                wallet. This includes proposal creation fees and unused gas sponsorship funds.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">Amount (ETH)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.0"
                                    step="0.001"
                                    min="0"
                                    max={balance}
                                    className="input pr-20"
                                />
                                <button
                                    onClick={() => setWithdrawAmount(balance)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors"
                                >
                                    MAX
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">
                                Available: <strong>{parseFloat(balance).toFixed(6)} ETH</strong>
                            </p>
                        </div>

                        <button
                            onClick={handleWithdraw}
                            disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
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
                                    Withdraw Funds
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
                                    Only withdraw funds that are not reserved for active proposals. Withdrawing too much
                                    may prevent gas sponsorship from working properly.
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
