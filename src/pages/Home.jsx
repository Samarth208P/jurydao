import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    Shield,
    Users,
    Vote,
    Zap,
    CheckCircle,
    TrendingUp,
    Lock,
    Globe
} from 'lucide-react'

const Home = () => {
    const [stats, setStats] = useState({
        totalProposals: 0,
        activeProposals: 0,
        registeredJurors: 0,
        totalVotes: 0,
    })
    const [loading, setLoading] = useState(true)

    const governor = useContract('governor')
    const registry = useContract('registry')

    useEffect(() => {
        fetchStats()
    }, [governor, registry])

    const fetchStats = async () => {
        if (!governor || !registry) return

        try {
            // Get total proposals
            const proposalCount = await governor.proposalCount()
            const total = Number(proposalCount)

            // Count active proposals and total votes
            let active = 0
            let votes = 0

            for (let i = 0; i < total; i++) {
                const proposal = await governor.getProposal(i)
                const state = proposal[6] // state index

                if (state === 1) active++ // Active state

                votes += Number(proposal[3]) + Number(proposal[4]) // forVotes + againstVotes
            }

            // Get registered jurors
            const jurorCount = await registry.getJurorCount()

            setStats({
                totalProposals: total,
                activeProposals: active,
                registeredJurors: Number(jurorCount),
                totalVotes: votes,
            })

            console.log('📊 Stats loaded:', { total, active, jurors: Number(jurorCount), votes })
        } catch (error) {
            console.error('Error fetching stats:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const features = [
        {
            icon: Shield,
            title: 'Verifiable Randomness',
            description: 'Powered by Pyth Entropy VRF for cryptographically secure jury selection',
            color: 'blue',
        },
        {
            icon: Users,
            title: 'Fair Selection',
            description: 'Every staked participant has equal chance regardless of token holdings',
            color: 'purple',
        },
        {
            icon: Lock,
            title: 'Sybil Resistant',
            description: 'Minimum stake requirement prevents manipulation and ensures quality',
            color: 'green',
        },
        {
            icon: Zap,
            title: 'Gas Efficient',
            description: 'Optimized smart contracts with minimal transaction costs (~0.001 ETH)',
            color: 'yellow',
        },
    ]

    const benefits = [
        'No plutocracy - equal voting power',
        'Transparent on-chain voting',
        'Automated jury selection',
        'Secure & audited contracts',
    ]

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 md:py-32">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-dark-bg to-accent-purple/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block mb-6 px-6 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/30"
                        >
              <span className="text-accent-blue font-semibold text-sm flex items-center gap-2">
                <Globe size={16} />
                Powered by Pyth Entropy on Base Sepolia
              </span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                            Decentralized Governance
                            <br />
                            <span className="text-accent-blue">Done Right</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
                            Fair decision-making through cryptographically verifiable random jury selection.
                            No whales. No manipulation. Just pure democracy.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/dashboard" className="btn btn-primary text-lg px-8 py-4 group">
                                View Proposals
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </Link>
                            <Link to="/juror" className="btn btn-secondary text-lg px-8 py-4">
                                Become a Juror
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-dark-card/30 backdrop-blur-sm border-y border-dark-border">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {[
                            { label: 'Total Proposals', value: loading ? '...' : stats.totalProposals, color: 'blue' },
                            { label: 'Active Proposals', value: loading ? '...' : stats.activeProposals, color: 'green' },
                            { label: 'Registered Jurors', value: loading ? '...' : stats.registeredJurors, color: 'purple' },
                            { label: 'Votes Cast', value: loading ? '...' : stats.totalVotes, color: 'yellow' },
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="text-center p-6 rounded-xl bg-dark-card border border-dark-border hover:border-accent-blue/50 transition-all"
                            >
                                <div className={`text-4xl md:text-5xl font-bold mb-2 text-accent-${stat.color}`}>
                                    {stat.value}
                                    {!loading && stat.value > 0 && '+'}
                                </div>
                                <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Why JuryDAO?</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Built with cutting-edge technology to ensure fair, transparent, and secure governance
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 * index }}
                                className="card hover:border-accent-blue/50 transition-all group"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-accent-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`text-accent-${feature.color}`} size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-dark-card/30">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Simple, transparent process from proposal to execution
                        </p>
                    </motion.div>

                    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Stake & Register',
                                description: 'Stake minimum 100 DGOV tokens to become an eligible juror',
                                icon: Lock,
                            },
                            {
                                step: '02',
                                title: 'Random Selection',
                                description: 'Pyth Entropy VRF randomly selects jurors for each proposal',
                                icon: Zap,
                            },
                            {
                                step: '03',
                                title: 'Vote & Execute',
                                description: 'Selected jurors vote during 7-day period, then anyone can execute',
                                icon: Vote,
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 * index }}
                                className="relative"
                            >
                                <div className="card text-center">
                                    <div className="text-6xl font-bold text-accent-blue/20 mb-4">{item.step}</div>
                                    <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                                        <item.icon className="text-accent-blue" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-gray-400">{item.description}</p>
                                </div>
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight className="text-accent-blue/30" size={32} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                True Democratic
                                <br />
                                <span className="text-accent-purple">Governance</span>
                            </h2>
                            <p className="text-xl text-gray-400 mb-8">
                                Unlike token-weighted systems, JuryDAO ensures every participant has an equal voice through random selection.
                            </p>
                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={benefit}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 * index }}
                                        className="flex items-center gap-3"
                                    >
                                        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                                        <span className="text-lg">{benefit}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="card bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border-accent-blue/30 p-8"
                        >
                            <TrendingUp className="text-accent-blue mb-4" size={48} />
                            <h3 className="text-2xl font-bold mb-4">Live Network Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Total Proposals</span>
                                    <span className="text-2xl font-bold">{loading ? '...' : stats.totalProposals}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Active Jurors</span>
                                    <span className="text-2xl font-bold">{loading ? '...' : stats.registeredJurors}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Community Votes</span>
                                    <span className="text-2xl font-bold">{loading ? '...' : stats.totalVotes}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-accent-blue/10 via-dark-bg to-accent-purple/10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="card max-w-4xl mx-auto text-center border-accent-blue/30 bg-dark-card/50 backdrop-blur-sm p-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Participate?
                        </h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            Join the future of decentralized governance. Stake tokens, get selected, and make your voice heard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/dashboard" className="btn btn-primary text-lg px-8 py-4">
                                Explore Proposals
                            </Link>
                            <Link to="/juror" className="btn btn-secondary text-lg px-8 py-4">
                                Register as Juror
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default Home
