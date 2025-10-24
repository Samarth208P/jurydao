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

            const proposalList = []
            for (let i = 0; i < total; i++) {
                const data = await governor.getProposal(i)
                proposalList.push({
                    id: i,
                    title: data[0],
                    description: data[1],
                    proposer: data[2],
                    forVotes: data[3],
                    againstVotes: data[4],
                    deadline: data[5],
                    state: Number(data[6]),  // Make sure to convert to number
                    jurySize: data[7],
                })
            }

            setProposals(proposalList.reverse()) // Show newest first
            console.log('✅ Loaded proposals:', proposalList)
        } catch (error) {
            console.error('Fetch proposals error:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProposals = proposals.filter(p => {
        if (filter === 'all') return true
        if (filter === 'pending') return p.state === PROPOSAL_STATES.PENDING
        if (filter === 'active') return p.state === PROPOSAL_STATES.ACTIVE
        if (filter === 'completed') return p.state >= PROPOSAL_STATES.DEFEATED
        return true
    })

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card max-w-md w-full text-center p-8"
                >
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to view proposals</p>
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
                <LoadingSpinner size="lg" text="Loading proposals..." />
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Proposals</h1>
                            <p className="text-gray-400">
                                {proposals.length} total proposal{proposals.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Link to="/create" className="btn btn-primary">
                            <Plus size={20} />
                            Create Proposal
                        </Link>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                        <Filter size={18} className="text-gray-500 flex-shrink-0" />
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'active', label: 'Active' },
                            { key: 'completed', label: 'Completed' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                    filter === key
                                        ? 'bg-accent-blue text-white'
                                        : 'bg-dark-card text-gray-400 hover:bg-dark-bg'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Proposals Grid */}
                    {filteredProposals.length === 0 ? (
                        <EmptyState
                            title={`No ${filter === 'all' ? '' : filter} proposals`}
                            description={
                                filter === 'all'
                                    ? 'Be the first to create a proposal'
                                    : `No proposals in ${filter} state`
                            }
                            action={
                                filter === 'all' && (
                                    <Link to="/create" className="btn btn-primary">
                                        <Plus size={20} />
                                        Create Proposal
                                    </Link>
                                )
                            }
                        />
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {filteredProposals.map((proposal, index) => (
                                <ProposalCard
                                    key={proposal.id}
                                    proposal={proposal}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default Dashboard
