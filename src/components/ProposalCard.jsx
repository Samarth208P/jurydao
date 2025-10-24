import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import { formatAddress, formatTimeLeft, formatProposalState, formatDate } from '../utils/format'
import { STATE_COLORS, PROPOSAL_STATES } from '../utils/constants'
import { motion } from 'framer-motion'

const ProposalCard = ({ proposal, index }) => {
    const navigate = useNavigate()

    const getTimeDisplay = () => {
        const now = Date.now() / 1000
        const deadline = Number(proposal.deadline)

        // If PENDING (waiting for juror selection)
        if (proposal.state === PROPOSAL_STATES.PENDING) {
            return 'Awaiting Jury Selection'
        }

        // If ACTIVE and voting period active
        if (proposal.state === PROPOSAL_STATES.ACTIVE && now < deadline) {
            return `Ends in ${formatTimeLeft(deadline)}`
        }

        // If ACTIVE but deadline passed
        if (proposal.state === PROPOSAL_STATES.ACTIVE && now >= deadline) {
            return 'Voting Ended'
        }

        // All other states show deadline date
        return formatDate(deadline)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/proposal/${proposal.id}`)}
            className="card hover:border-accent-blue/50 cursor-pointer transition-all hover:scale-[1.02]"
        >
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold pr-4 line-clamp-2">{proposal.title}</h3>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${STATE_COLORS[proposal.state]}`}>
                    {formatProposalState(proposal.state)}
                </span>
            </div>

            <p className="text-gray-400 mb-4 line-clamp-2">
                {proposal.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{getTimeDisplay()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{proposal.jurySize} Jurors</span>
                </div>
            </div>
        </motion.div>
    )
}

export default ProposalCard
