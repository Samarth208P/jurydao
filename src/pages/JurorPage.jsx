import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { Shield, CheckCircle, XCircle, Coins } from 'lucide-react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'

const MINSTAKE = 100 // Minimum stake in DGOV tokens

const JurorPage = () => {
    const [isJuror, setIsJuror] = useState(false)
    const [balance, setBalance] = useState('0')
    const [stakeAmount, setStakeAmount] = useState(MINSTAKE.toString())
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [approving, setApproving] = useState(false)

    const { account, isConnected, connectWallet } = useWallet()
    const token = useContract('governanceToken')  // ✅ FIXED
    const registry = useContract('jurorRegistry')  // ✅ FIXED

    useEffect(() => {
        if (account) {
            checkJurorStatus()
            fetchBalance()
        }
    }, [account, registry, token])

    const checkJurorStatus = async () => {
        if (!registry || !account) return

        try {
            const status = await registry.isJuror(account)
            setIsJuror(status)
            console.log('Juror status:', status)
        } catch (error) {
            console.error('Check juror status error:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchBalance = async () => {
        if (!token || !account) return

        try {
            const bal = await token.balanceOf(account)
            setBalance(ethers.formatEther(bal))
            console.log('DGOV balance:', ethers.formatEther(bal))
        } catch (error) {
            console.error('Fetch balance error:', error.message)
        }
    }

    const handleApprove = async () => {
        if (!token || !registry) return

        setApproving(true)

        try {
            const amount = ethers.parseEther(stakeAmount)
            console.log('Approving tokens...')

            const tx = await token.approve(await registry.getAddress(), amount)
            toast.loading('Approving tokens...', { id: 'approve' })
            await tx.wait()

            toast.success('Tokens approved!', { id: 'approve' })
            console.log('Approval successful')
        } catch (error) {
            console.error('Approve error:', error)
            toast.error('Approval failed', { id: 'approve' })
        } finally {
            setApproving(false)
        }
    }

    const handleRegister = async () => {
        if (!registry) return

        setRegistering(true)

        try {
            const amount = ethers.parseEther(stakeAmount)
            console.log('Registering as juror...')

            const tx = await registry.registerJuror(amount)
            toast.loading('Registering as juror...', { id: 'register' })
            await tx.wait()

            toast.success('Successfully registered as juror!', { id: 'register' })
            console.log('Registration successful')
            setIsJuror(true)
            fetchBalance()
        } catch (error) {
            console.error('Register error:', error)
            toast.error('Registration failed', { id: 'register' })
        } finally {
            setRegistering(false)
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
                    <h2 className="text-2xl font-bold mb-4">Become a Juror</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to register as a juror</p>
                    <button onClick={connectWallet} className="btn btn-primary w-full">
                        Connect Wallet
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl font-bold mb-2">Become a Juror</h1>
                    <p className="text-gray-400 mb-8">
                        Stake tokens to participate in governance and earn rewards
                    </p>

                    {/* Status Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            icon={isJuror ? CheckCircle : XCircle}
                            label="Juror Status"
                            value={isJuror ? 'Registered' : 'Not Registered'}
                            color={isJuror ? 'green' : 'red'}
                            index={0}
                        />
                        <StatCard
                            icon={Coins}
                            label="DGOV Balance"
                            value={balance}
                            color="blue"
                            index={1}
                        />
                        <StatCard
                            icon={Shield}
                            label="Minimum Stake"
                            value={`${MINSTAKE} DGOV`}
                            color="purple"
                            index={2}
                        />
                    </div>

                    {!isJuror ? (
                        <div className="card">
                            <h2 className="text-2xl font-bold mb-6">Register as Juror</h2>

                            {/* Stake Amount */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2">
                                    Stake Amount (DGOV)
                                </label>
                                <input
                                    type="number"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    min={MINSTAKE}
                                    className="input"
                                    placeholder={`Minimum ${MINSTAKE} DGOV`}
                                />
                                <p className="text-sm text-gray-400 mt-2">
                                    You currently have {balance} DGOV tokens
                                </p>
                            </div>

                            {/* Info */}
                            <div className="card bg-blue-500/5 border-blue-500/20 mb-6">
                                <h3 className="font-semibold text-blue-400 mb-2">How it works</h3>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li>• Approve DGOV tokens for the registry contract</li>
                                    <li>• Register with your desired stake amount</li>
                                    <li>• Get randomly selected for proposal juries</li>
                                    <li>• Vote on proposals and earn rewards</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={approving || parseFloat(balance) < MINSTAKE}
                                    className="btn btn-secondary flex-1"
                                >
                                    {approving ? (
                                        <>
                                            <span className="spinner"></span>
                                            Approving...
                                        </>
                                    ) : (
                                        'Approve Tokens'
                                    )}
                                </button>
                                <button
                                    onClick={handleRegister}
                                    disabled={registering || parseFloat(balance) < MINSTAKE}
                                    className="btn btn-primary flex-1"
                                >
                                    {registering ? (
                                        <>
                                            <span className="spinner"></span>
                                            Registering...
                                        </>
                                    ) : (
                                        'Register as Juror'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card text-center p-12 bg-gradient-to-br from-green-500/5 to-blue-500/5 border-green-500/20">
                            <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                            <h2 className="text-3xl font-bold mb-4">You're a Juror!</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                You're now eligible to be randomly selected for proposal juries. Check your dashboard
                                for active proposals.
                            </p>
                            <a href="/dashboard" className="btn btn-primary">
                                View Proposals
                            </a>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default JurorPage
