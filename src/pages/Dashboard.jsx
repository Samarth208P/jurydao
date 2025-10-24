import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useContract } from '../hooks/useContract'
import { FileText, Users, CheckCircle, XCircle, Clock, TrendingUp, Plus } from 'lucide-react'
import StatCard from '../components/StatCard'
import ProposalCard from '../components/ProposalCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { motion } from 'framer-motion'

const Dashboard = () => {
    const navigate = useNavigate()
    const { account } = useWallet()
    const governor = useContract('governor')

    const [proposals, setProposals] = useState([])
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        succeeded: 0,
        defeated: 0
    })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchProposals()
    }, [governor])

    const fetchProposals = async () => {
        if (!governor) return

        try {
            console.log('📥 Fetching proposals...')

            const count = await governor.proposalCount()
            const proposalCount = Number(count)

            console.log('Total proposals:', proposalCount)

            if (proposalCount === 0) {
                setProposals([])
                setLoading(false)
                return
            }

            const proposalsArray = []
            let activeCount = 0
            let succeededCount = 0
            let defeatedCount = 0

            for (let i = 0; i < proposalCount; i++) {
                try {
                    const data = await governor.getProposal(i)

                    const proposal = {
                        id: i,
                        title: data[0] || '',
                        description: data[1] || '',
                        proposer: data[2] || '',
                        forVotes: data[3] || 0n,
                        againstVotes: data[4] || 0n,
                        deadline: data[5] || 0n,
                        state: data[6] || 0,
                        jurySize: data[7] || 0n,
                        feesSponsoredByProposer: data[8] || false,
                        gasPerVote: data[9] || 0n,
                    }

                    proposalsArray.push(proposal)

                    if (Number(proposal.state) === 1) activeCount++
                    if (Number(proposal.state) === 3) succeededCount++
                    if (Number(proposal.state) === 2) defeatedCount++
                } catch (error) {
                    console.error(`Error fetching proposal ${i}:`, error)
                }
            }

            setProposals(proposalsArray.reverse())
            setStats({
                total: proposalCount,
                active: activeCount,
                succeeded: succeededCount,
                defeated: defeatedCount
            })

            console.log('✅ Loaded', proposalsArray.length, 'proposals')
        } catch (error) {
            console.error('Error fetching proposals:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProposals = proposals.filter(p => {
        const state = Number(p.state)
        if (filter === 'all') return true
        if (filter === 'active') return state === 1
        if (filter === 'succeeded') return state === 3
        if (filter === 'defeated') return state === 2
        return true
    })

    const filterButtons = [
        { key: 'all', label: 'All Proposals', count: stats.total },
        { key: 'active', label: 'Active', count: stats.active },
        { key: 'succeeded', label: 'Succeeded', count: stats.succeeded },
        { key: 'defeated', label: 'Defeated', count: stats.defeated },
    ]

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <LoadingSpinner size="lg" text="Loading proposals..." />
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 bg-gray-900 text-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Governance Dashboard
                        </h1>
                        <p className="text-gray-400">
                            Participate in decentralized decision making
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/create-proposal')}
                        className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Create Proposal
                    </button>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={FileText}
                        label="Total Proposals"
                        value={stats.total}
                        color="blue"
                        index={0}
                    />
                    <StatCard
                        icon={Clock}
                        label="Active"
                        value={stats.active}
                        color="purple"
                        index={1}
                        subtitle="Open for voting"
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Succeeded"
                        value={stats.succeeded}
                        color="green"
                        index={2}
                    />
                    <StatCard
                        icon={XCircle}
                        label="Defeated"
                        value={stats.defeated}
                        color="red"
                        index={3}
                    />
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap gap-2 mb-6"
                >
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.key}
                            onClick={() => setFilter(btn.key)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                filter === btn.key
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                            }`}
                        >
                            {btn.label} ({btn.count})
                        </button>
                    ))}
                </motion.div>

                {/* Proposals */}
                {filteredProposals.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title={filter === 'all' ? 'No proposals yet' : `No ${filter} proposals`}
                        description={
                            filter === 'all'
                                ? 'Be the first to create a proposal!'
                                : `There are no ${filter} proposals at the moment.`
                        }
                        action={
                            filter === 'all' && {
                                label: 'Create First Proposal',
                                onClick: () => navigate('/create-proposal')
                            }
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProposals.map((proposal, index) => (
                            <ProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
