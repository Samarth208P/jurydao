export const MIN_STAKE = 100 // Minimum stake in DGOV tokens
export const VOTING_PERIOD = 7 * 24 * 60 * 60 // 7 days in seconds

export const PROPOSAL_STATES = {
    PENDING: 0,
    ACTIVE: 1,
    DEFEATED: 2,
    SUCCEEDED: 3,
    EXECUTED: 4
}

export const STATE_COLORS = {
    0: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    1: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    2: 'bg-red-500/10 text-red-400 border-red-500/30',
    3: 'bg-green-500/10 text-green-400 border-green-500/30',
    4: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
}

export const JURY_SIZES = [3, 5, 7, 10]

// Block Explorer Configuration
export const BLOCK_EXPLORER = {
    BASE_SEPOLIA: 'https://sepolia.basescan.org',
    BASE_MAINNET: 'https://basescan.org'
}

export const NETWORK_CONFIG = {
    84532: { // Base Sepolia
        name: 'Base Sepolia',
        explorer: BLOCK_EXPLORER.BASE_SEPOLIA,
        currency: 'ETH'
    },
    8453: { // Base Mainnet
        name: 'Base',
        explorer: BLOCK_EXPLORER.BASE_MAINNET,
        currency: 'ETH'
    }
}

export const getExplorerUrl = (chainId = 84532) => {
    return NETWORK_CONFIG[chainId]?.explorer || BLOCK_EXPLORER.BASE_SEPOLIA
}

export const getExplorerLink = (type, value, chainId = 84532) => {
    const explorer = getExplorerUrl(chainId)
    switch (type) {
        case 'tx':
            return `${explorer}/tx/${value}`
        case 'address':
            return `${explorer}/address/${value}`
        case 'block':
            return `${explorer}/block/${value}`
        case 'token':
            return `${explorer}/token/${value}`
        default:
            return explorer
    }
}
