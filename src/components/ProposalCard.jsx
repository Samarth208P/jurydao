import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatTimeLeft, formatProposalState, calculatePercentage } from '../utils/format'
import { STATE_COLORS } from '../utils/constants'
import { motion } from 'framer-motion'

const ProposalCard = ({ proposal, index }) => {
    const navigate = useNavigate()

    const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes)
    const forPercentage = calculatePercentage(Number(proposal.forVotes), totalVotes)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/proposal/${proposal.id}`)}
            className="card cursor-pointer group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent-blue transition-colors">
                        {proposal.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{proposal.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${STATE_COLORS[proposal.state]}`}>
          {formatProposalState(proposal.state)}
        </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-gray-400">
            {proposal.state === 1 ? formatTimeLeft(proposal.deadline) : 'Voting Ended'}
          </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-gray-500" />
                    <span className="text-gray-400">{proposal.jurySize} Jurors</span>
                </div>
            </div>

            {/* Vote Progress */}
            {totalVotes > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-400">
              <ThumbsUp size={14} />
                {proposal.forVotes} For
            </span>
                        <span className="flex items-center gap-1 text-red-400">
              <ThumbsDown size={14} />
                            {proposal.againstVotes} Against
            </span>
                    </div>
                    <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                            style={{ width: `${forPercentage}%` }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    )
}

export default ProposalCard
