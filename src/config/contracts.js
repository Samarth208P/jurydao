// src/config/contracts.js

// Contract addresses from .env
export const CONTRACTS = {
    // ✅ FIXED: Correct env variable names
    governanceToken: import.meta.env.VITE_GOVERNANCE_TOKEN,
    jurorRegistry: import.meta.env.VITE_JUROR_REGISTRY,
    governor: import.meta.env.VITE_GOVERNOR_SORTITION,
}

// Pyth Entropy addresses (Base Sepolia - these never change)
export const PYTH_ENTROPY = {
    entropy: '0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c',
    provider: '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6334'
}

// Chain config
export const CHAIN_CONFIG = {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org'
}

// ABIs - Import from Foundry output
import GovernorABI from '../../out/GovernorSortition.sol/GovernorSortition.json'
import RegistryABI from '../../out/JurorRegistry.sol/JurorRegistry.json'
import TokenABI from '../../out/GovernanceToken.sol/GovernanceToken.json'

export const ABIS = {
    governor: GovernorABI.abi,
    jurorRegistry: RegistryABI.abi,
    governanceToken: TokenABI.abi
}
