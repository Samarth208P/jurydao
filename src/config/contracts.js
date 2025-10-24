// Import ABIs from Foundry output
import GovernorABI from '../../out/GovernorSortition.sol/GovernorSortition.json'
import RegistryABI from '../../out/JurorRegistry.sol/JurorRegistry.json'
import TokenABI from '../../out/GovernanceToken.sol/GovernanceToken.json'

// Contract addresses from .env (matching your variable names)
export const CONTRACTS = {
    governor: import.meta.env.VITE_GOVERNOR_SORTITION,           // ← Changed
    jurorRegistry: import.meta.env.VITE_JUROR_REGISTRY,          // ← Changed
    governanceToken: import.meta.env.VITE_GOVERNANCE_TOKEN,      // ← Changed
}

// Extract ABIs from Foundry JSON
export const ABIS = {
    governor: GovernorABI.abi,
    jurorRegistry: RegistryABI.abi,
    governanceToken: TokenABI.abi,
}

// Network constants (from your .env)
export const CHAIN_ID = 84532
export const CHAIN_NAME = 'Base Sepolia'
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org'
export const BLOCK_EXPLORER = 'https://sepolia.basescan.org'

// Pyth Entropy configuration (from your .env)
export const PYTH_ENTROPY = import.meta.env.VITE_PYTH_ENTROPY || '0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c'
export const PYTH_PROVIDER = import.meta.env.VITE_PYTH_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344'
