export const NETWORK = {
    chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '84532'),
    name: import.meta.env.VITE_NETWORK_NAME || 'Base Sepolia',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
}

export const CONTRACTS = {
    GOVERNANCE_TOKEN: import.meta.env.VITE_GOVERNANCE_TOKEN,
    JUROR_REGISTRY: import.meta.env.VITE_JUROR_REGISTRY,
    GOVERNOR_SORTITION: import.meta.env.VITE_GOVERNOR_SORTITION,
}

export const PYTH = {
    ENTROPY: import.meta.env.VITE_PYTH_ENTROPY,
    PROVIDER: import.meta.env.VITE_PYTH_PROVIDER,
}

console.log('🔗 Network:', NETWORK.name)
console.log('📜 Contracts loaded:', Object.keys(CONTRACTS).length)
