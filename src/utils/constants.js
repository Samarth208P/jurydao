export const PROPOSAL_STATES = {
    PENDING: 0,
    ACTIVE: 1,
    DEFEATED: 2,
    SUCCEEDED: 3,
    EXECUTED: 4,
}

export const STATE_COLORS = {
    0: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    2: 'bg-red-500/10 text-red-400 border-red-500/20',
    3: 'bg-green-500/10 text-green-400 border-green-500/20',
    4: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export const JURY_SIZES = [
    { value: 1, label: '1 Juror (Test)', description: 'Quick testing' },
    { value: 3, label: '3 Jurors (Small)', description: 'Fast decisions' },
    { value: 5, label: '5 Jurors (Medium)', description: 'Balanced' },
    { value: 10, label: '10 Jurors (Large)', description: 'High security' },
]

export const VOTING_PERIOD = 7 * 24 * 60 * 60 // 7 days in seconds
export const MIN_STAKE = 100 // Minimum DGOV tokens to stake
