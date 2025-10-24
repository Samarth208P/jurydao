import { useMemo } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { CONTRACTS } from '../config/contracts'

// Import ABIs directly from Foundry output
import GovernanceTokenArtifact from '../../out/GovernanceToken.sol/GovernanceToken.json'
import JurorRegistryArtifact from '../../out/JurorRegistry.sol/JurorRegistry.json'
import GovernorSortitionArtifact from '../../out/GovernorSortition.sol/GovernorSortition.json'

export const useContract = (contractName) => {
    const { signer, isConnected } = useWallet()

    return useMemo(() => {
        if (!signer || !isConnected) {
            console.log('⏳ Wallet not connected')
            return null
        }

        const contractConfigs = {
            governor: {
                address: CONTRACTS.GOVERNOR_SORTITION,
                abi: GovernorSortitionArtifact.abi,
            },
            registry: {
                address: CONTRACTS.JUROR_REGISTRY,
                abi: JurorRegistryArtifact.abi,
            },
            token: {
                address: CONTRACTS.GOVERNANCE_TOKEN,
                abi: GovernanceTokenArtifact.abi,
            },
        }

        const config = contractConfigs[contractName]

        if (!config) {
            console.error(`❌ Unknown contract: ${contractName}`)
            return null
        }

        if (!config.address) {
            console.error(`❌ Address not set for ${contractName}. Check .env file.`)
            return null
        }

        if (!Array.isArray(config.abi)) {
            console.error(`❌ Invalid ABI for ${contractName}`)
            return null
        }

        try {
            const contract = new ethers.Contract(config.address, config.abi, signer)
            console.log(`✅ ${contractName} contract loaded:`, config.address.slice(0, 6))
            return contract
        } catch (error) {
            console.error(`❌ Failed to create ${contractName} contract:`, error)
            return null
        }
    }, [contractName, signer, isConnected])
}
