import { CONTRACT_ADDRESSES, PYTH_CONFIG, NETWORK_CONFIG } from '../config/contracts'

// Re-export contract addresses
export const GOVERNOR_ADDRESS = CONTRACT_ADDRESSES.GOVERNOR
export const JUROR_REGISTRY_ADDRESS = CONTRACT_ADDRESSES.JUROR_REGISTRY
export const GOVERNANCE_TOKEN_ADDRESS = CONTRACT_ADDRESSES.GOVERNANCE_TOKEN

// Re-export Pyth config
export const PYTH_ENTROPY_ADDRESS = PYTH_CONFIG.ENTROPY
export const PYTH_PROVIDER_ADDRESS = PYTH_CONFIG.PROVIDER

// Re-export network config
export const CHAIN_ID = NETWORK_CONFIG.CHAIN_ID
export const NETWORK_NAME = NETWORK_CONFIG.NAME
export const RPC_URL = NETWORK_CONFIG.RPC_URL

// Proposal states
export const PROPOSAL_STATE = {
    PENDING: 0,
    ACTIVE: 1,
    COMPLETED: 2,
    EXECUTED: 3,
    DEFEATED: 4
}

export const PROPOSAL_STATE_LABELS = {
    0: 'Pending',
    1: 'Active',
    2: 'Completed',
    3: 'Executed',
    4: 'Defeated'
}

// State colors for UI
export const STATE_COLORS = {
    0: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',   // Pending
    1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',         // Active
    2: 'bg-green-500/20 text-green-300 border-green-500/30',      // Completed
    3: 'bg-purple-500/20 text-purple-300 border-purple-500/30',   // Executed
    4: 'bg-red-500/20 text-red-300 border-red-500/30'             // Defeated
}

// Text colors for states
export const STATE_TEXT_COLORS = {
    0: 'text-yellow-400',
    1: 'text-blue-400',
    2: 'text-green-400',
    3: 'text-purple-400',
    4: 'text-red-400'
}

// Time constants
export const SECONDS_PER_DAY = 86400
export const SECONDS_PER_HOUR = 3600
export const SECONDS_PER_MINUTE = 60

// Gas constants
export const BASE_FEE = '0.01' // 0.01 ETH base fee
export const GAS_PER_VOTE = '0.001' // Gas cost per vote

// Juror constants
export const MIN_STAKE = '100' // Minimum stake to become juror
export const MIN_JURORS = 3
export const MAX_JURORS = 25

// Voting constants
export const MIN_VOTING_DURATION = 3600 // 1 hour
export const MAX_VOTING_DURATION = 2592000 // 30 days
