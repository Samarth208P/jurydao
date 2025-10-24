// Contract addresses from .env
export const CONTRACT_ADDRESSES = {
    GOVERNOR: import.meta.env.VITE_GOVERNOR_SORTITION || '',
    JUROR_REGISTRY: import.meta.env.VITE_JUROR_REGISTRY || '',
    GOVERNANCE_TOKEN: import.meta.env.VITE_GOVERNANCE_TOKEN || ''
}

// Pyth Entropy (Base Sepolia)
export const PYTH_CONFIG = {
    ENTROPY: import.meta.env.VITE_PYTH_ENTROPY || '0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c',
    PROVIDER: import.meta.env.VITE_PYTH_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344'
}

// Network
export const NETWORK_CONFIG = {
    CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID) || 84532,
    NAME: import.meta.env.VITE_NETWORK_NAME || 'Base Sepolia',
    RPC_URL: import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org'
}
