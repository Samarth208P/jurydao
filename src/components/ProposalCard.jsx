import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatTimeLeft, formatProposalState } from '../utils/format'
import { STATE_COLORS } from '../utils/constants'

const ProposalCard = ({ proposal, index }) => {
    const stateConfig = STATE_COLORS[proposal.state] || STATE_COLORS[0]

    const votingProgress = () => {
        const total = proposal.forVotes + proposal.againstVotes
        if (total === 0) return 0
        return (proposal.forVotes / total) * 100
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ y: -6 }}
            className="group"
        >
            <Link to={`/proposal/${proposal.id}`} className="block">
                <div className="card relative overflow-hidden">
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 mr-4">
                                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                                    {proposal.title}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                    {proposal.description}
                                </p>
                            </div>
                            <span className={`badge badge-${stateConfig.color} flex-shrink-0 backdrop-blur-xl`}>
                                {formatProposalState(proposal.state)}
                            </span>
                        </div>

                        {/* Voting Progress */}
                        {(proposal.forVotes > 0 || proposal.againstVotes > 0) && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-green-500/10 rounded-lg">
                                            <ThumbsUp size={14} className="text-green-400" />
                                        </div>
                                        <span className="text-green-400 font-semibold">{proposal.forVotes}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400 font-semibold">{proposal.againstVotes}</span>
                                        <div className="p-1.5 bg-red-500/10 rounded-lg">
                                            <ThumbsDown size={14} className="text-red-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="progress-bar h-2.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${votingProgress()}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                        className="progress-bar-fill bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1.5 group/item hover:text-blue-400 transition-colors">
                                    <Users size={16} />
                                    <span>{proposal.jurySize}</span>
                                </div>
                                {proposal.state === 1 && proposal.votingEnds && (
                                    <div className="flex items-center gap-1.5 group/item hover:text-purple-400 transition-colors">
                                        <Clock size={16} />
                                        <span>{formatTimeLeft(proposal.votingEnds)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 font-semibold">
                                <span className="group-hover:mr-1 transition-all">View</span>
                                <ArrowRight
                                    size={18}
                                    className="group-hover:translate-x-2 transition-transform duration-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Glow Effect on Hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-2xl" />
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

export default ProposalCard
