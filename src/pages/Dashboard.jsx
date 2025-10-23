import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../context/WalletContext'
import { Plus, Filter } from 'lucide-react'
import ProposalCard from '../components/ProposalCard'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'
import { PROPOSAL_STATES } from '../utils/constants'

const Dashboard = () => {
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    const { isConnected, connectWallet } = useWallet()
    const governor = useContract('governor')

    useEffect(() => {
        fetchProposals()
    }, [governor])

    const fetchProposals = async () => {
        if (!governor) return

        try {
            console.log('📥 Fetching proposals...')
            const count = await governor.proposalCount()
            const total = Number(count)
            console.log('📊 Total proposals:', total)

            const proposalsData = []
            for (let i = 0; i < total; i++) {
                const data = await governor.getProposal(i)
                proposalsData.push({
                    id: i,
                    title: data[0],
                    description: data[1],
                    proposer: data[2],
                    forVotes: Number(data[3]),
                    againstVotes: Number(data[4]),
                    deadline: Number(data[5]),
                    state: data[6],
                    jurySize: Number(data[7]),
                })
            }

            setProposals(proposalsData.reverse())
            console.log('✅ Proposals loaded:', proposalsData.length)
        } catch (error) {
            console.error('Error fetching proposals:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredProposals = proposals.filter((proposal) => {
        if (filter === 'all') return true
        if (filter === 'active') return proposal.state === PROPOSAL_STATES.ACTIVE
        if (filter === 'pending') return proposal.state === PROPOSAL_STATES.PENDING
        if (filter === 'completed') return proposal.state === PROPOSAL_STATES.SUCCEEDED || proposal.state === PROPOSAL_STATES.DEFEATED || proposal.state === PROPOSAL_STATES.EXECUTED
        return true
    })

    const stats = {
        total: proposals.length,
        active: proposals.filter(p => p.state === PROPOSAL_STATES.ACTIVE).length,
        pending: proposals.filter(p => p.state === PROPOSAL_STATES.PENDING).length,
        completed: proposals.filter(p => p.state === PROPOSAL_STATES.SUCCEEDED || p.state === PROPOSAL_STATES.DEFEATED || p.state === PROPOSAL_STATES.EXECUTED).length,
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
                    <p className="text-gray-400 mb-6">Connect your wallet to view and vote on proposals</p>
                    <button onClick={connectWallet} className="btn btn-primary w-full">
                        Connect Wallet
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Governance Dashboard</h1>
                        <p className="text-gray-400">View and vote on active proposals</p>
                    </div>
                    <Link to="/create-proposal" className="btn btn-primary">
                        <Plus size={20} />
                        Create Proposal
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, color: 'blue' },
                        { label: 'Active', value: stats.active, color: 'green' },
                        { label: 'Pending', value: stats.pending, color: 'yellow' },
                        { label: 'Completed', value: stats.completed, color: 'purple' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="card text-center"
                        >
                            <div className="text-3xl font-bold mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-400">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                    <Filter size={20} className="text-gray-400 flex-shrink-0" />
                    {[
                        { key: 'all', label: 'All Proposals' },
                        { key: 'active', label: 'Active' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'completed', label: 'Completed' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                filter === tab.key
                                    ? 'bg-accent-blue text-white'
                                    : 'bg-dark-card text-gray-400 hover:bg-dark-border'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Proposals List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size="lg" text="Loading proposals..." />
                    </div>
                ) : filteredProposals.length === 0 ? (
                    <EmptyState
                        title={filter === 'all' ? 'No proposals yet' : `No ${filter} proposals`}
                        description={
                            filter === 'all'
                                ? 'Be the first to create a proposal for the community'
                                : `There are currently no ${filter} proposals`
                        }
                        action={
                            filter === 'all' && {
                                label: 'Create Proposal',
                                to: '/create-proposal',
                            }
                        }
                    />
                ) : (
                    <div className="grid gap-6">
                        {filteredProposals.map((proposal, index) => (
                            <motion.div
                                key={proposal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <ProposalCard proposal={proposal} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
