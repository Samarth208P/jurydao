// Contract addresses from environment
export const CONTRACTS = {
    GOVERNANCE_TOKEN: import.meta.env.VITE_GOVERNANCE_TOKEN || '',
    JUROR_REGISTRY: import.meta.env.VITE_JUROR_REGISTRY || '',
    GOVERNOR_SORTITION: import.meta.env.VITE_GOVERNOR_SORTITION || '',
}

// Network configuration
export const NETWORK = {
    chainId: parseInt(import.meta.env.VITE_CHAIN_ID) || 84532,
    name: import.meta.env.VITE_NETWORK_NAME || 'Base Sepolia',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
}

// Pyth Entropy
export const PYTH = {
    ENTROPY: import.meta.env.VITE_PYTH_ENTROPY,
    PROVIDER: import.meta.env.VITE_PYTH_PROVIDER,
}

// Validation
if (!CONTRACTS.GOVERNOR_SORTITION) {
    console.warn('⚠️ Contracts not deployed yet. Run: forge script script/Deploy.s.sol')
}

console.log('📋 Config loaded:', {
    network: NETWORK.name,
    governor: CONTRACTS.GOVERNOR_SORTITION ? '✅' : '❌',
})
