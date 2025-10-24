// Proposal States (matches contract enum)
export const PROPOSAL_STATES = {
    PENDING: 0,
    ACTIVE: 1,
    DEFEATED: 2,
    SUCCEEDED: 3,
    EXECUTED: 4,
}

export const STATE_LABELS = {
    0: 'Pending',
    1: 'Active',
    2: 'Defeated',
    3: 'Succeeded',
    4: 'Executed',
}

export const STATE_COLORS = {
    0: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    2: 'bg-red-500/10 text-red-400 border-red-500/20',
    3: 'bg-green-500/10 text-green-400 border-green-500/20',
    4: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

// Voting Period Limits (from contract)
export const MIN_VOTING_PERIOD = 1 * 60 * 60 // 1 hour in seconds
export const MAX_VOTING_PERIOD = 30 * 24 * 60 * 60 // 30 days in seconds
export const DEFAULT_VOTING_PERIOD = 7 * 24 * 60 * 60 // 7 days in seconds

// Gas Refund (default, can be changed by owner)
export const DEFAULT_GAS_REFUND = '0.001' // ETH per vote

// Explorer Link Helper
export const getExplorerLink = (type, value, chainId = 84532) => {
    const baseUrl = 'https://sepolia.basescan.org'

    switch (type) {
        case 'address':
            return `${baseUrl}/address/${value}`
        case 'tx':
            return `${baseUrl}/tx/${value}`
        case 'token':
            return `${baseUrl}/token/${value}`
        default:
            return baseUrl
    }
}
