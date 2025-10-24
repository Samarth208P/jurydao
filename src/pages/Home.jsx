import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Users, Vote, Zap, CheckCircle, TrendingUp, Lock, Globe } from 'lucide-react'

const Home = () => {
    const [stats, setStats] = useState({
        totalProposals: 0,
        activeProposals: 0,
        registeredJurors: 0,
        totalVotes: 0,
    })
    const [loading, setLoading] = useState(true)

    const governor = useContract('governor')
    const registry = useContract('jurorRegistry')

    useEffect(() => {
        fetchStats()
    }, [governor, registry])

    const fetchStats = async () => {
        if (!governor || !registry) return

        try {
            const proposalCount = await governor.proposalCount()
            const total = Number(proposalCount)

            let active = 0
            let votes = 0

            for (let i = 0; i < total; i++) {
                const proposal = await governor.getProposal(i)
                const state = proposal[6]
                if (state === 1) active++
                votes += Number(proposal[3]) + Number(proposal[4])
            }

            const jurorCount = await registry.getJurorCount()

            setStats({
                totalProposals: total,
                activeProposals: active,
                registeredJurors: Number(jurorCount),
                totalVotes: votes,
            })

            console.log('✅ Stats loaded:', { total, active, jurors: Number(jurorCount), votes })
        } catch (error) {
            console.error('Error fetching stats:', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none"></div>

                <div className="container mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, type: 'spring' }}
                            className="flex justify-center mb-8"
                        >
                            <div className="relative">
                                <motion.img
                                    src="/favicon.png"
                                    alt="JuryDAO Logo"
                                    className="w-32 h-32 object-contain"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-3xl rounded-full" />
                            </div>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            JuryDAO
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-8">
                            Decentralized Governance Through Random Jury Selection
                        </p>
                        <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
                            Powered by Pyth Entropy for verifiable randomness, ensuring fair and transparent jury selection for every proposal
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/create-proposal" className="btn btn-primary">
                                Create Proposal
                                <ArrowRight className="ml-2" size={20} />
                            </Link>
                            <Link to="/dashboard" className="btn btn-secondary">
                                View Proposals
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 bg-gray-800/30">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        {[
                            {
                                icon: Vote,
                                label: 'Total Proposals',
                                value: stats.totalProposals,
                                color: 'from-blue-500 to-blue-600',
                            },
                            {
                                icon: TrendingUp,
                                label: 'Active Proposals',
                                value: stats.activeProposals,
                                color: 'from-green-500 to-green-600',
                            },
                            {
                                icon: Shield,
                                label: 'Registered Jurors',
                                value: stats.registeredJurors,
                                color: 'from-purple-500 to-purple-600',
                            },
                            {
                                icon: CheckCircle,
                                label: 'Total Votes',
                                value: stats.totalVotes,
                                color: 'from-orange-500 to-orange-600',
                            },
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                                className="card text-center"
                            >
                                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${stat.color} mb-3`}>
                                    <stat.icon size={24} className="text-white" />
                                </div>
                                <div className="text-3xl font-bold mb-1">
                                    {loading ? '...' : stat.value}
                                </div>
                                <div className="text-sm text-gray-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            JuryDAO combines blockchain technology with verifiable randomness to create a fair and transparent governance system
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Users,
                                title: 'Register as Juror',
                                description: 'Stake DGOV tokens to become eligible for random jury selection',
                                color: 'blue',
                            },
                            {
                                icon: Zap,
                                title: 'Random Selection',
                                description: 'Pyth Entropy ensures verifiable randomness for fair jury selection',
                                color: 'purple',
                            },
                            {
                                icon: Vote,
                                title: 'Vote & Earn',
                                description: 'Selected jurors vote on proposals and earn rewards for participation',
                                color: 'green',
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="card hover:border-blue-500/50 transition-all group"
                            >
                                <div className={`inline-flex p-4 rounded-lg bg-${feature.color}-500/10 border border-${feature.color}-500/20 mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={32} className={`text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-4 bg-gray-800/30">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">Why JuryDAO?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Experience truly decentralized governance with verifiable randomness
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Shield,
                                title: 'Fair Selection',
                                description: 'Verifiable randomness ensures unbiased jury selection',
                            },
                            {
                                icon: Lock,
                                title: 'Transparent',
                                description: 'All actions are recorded on-chain and publicly verifiable',
                            },
                            {
                                icon: Globe,
                                title: 'Decentralized',
                                description: 'No single entity controls the governance process',
                            },
                            {
                                icon: CheckCircle,
                                title: 'Rewarding',
                                description: 'Earn rewards for active participation in governance',
                            },
                        ].map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className="card text-center"
                            >
                                <div className="inline-flex p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
                                    <benefit.icon size={24} className="text-blue-400" />
                                </div>
                                <h3 className="font-bold mb-2">{benefit.title}</h3>
                                <p className="text-sm text-gray-400">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="card bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/30 text-center p-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                            Join the future of decentralized governance. Stake tokens, participate in proposals, and shape the community's direction.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/juror" className="btn btn-primary">
                                Become a Juror
                            </Link>
                            <Link to="/dashboard" className="btn btn-secondary">
                                Explore Proposals
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default Home
