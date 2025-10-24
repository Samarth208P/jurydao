import { useMemo } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { CONTRACT_ADDRESSES } from '../config/contracts'

// Import ABIs from Foundry out folder
import GovernorSortitionABI from '../../out/GovernorSortition.sol/GovernorSortition.json'
import JurorRegistryABI from '../../out/JurorRegistry.sol/JurorRegistry.json'
import GovernanceTokenABI from '../../out/GovernanceToken.sol/GovernanceToken.json'

export const useContract = (contractName) => {
    const { provider, signer } = useWallet()

    return useMemo(() => {
        if (!provider) {
            // Silent return - this is normal before wallet connection
            return null
        }

        try {
            let address, abi

            switch (contractName) {
                case 'governor':
                    address = CONTRACT_ADDRESSES.GOVERNOR
                    abi = GovernorSortitionABI.abi
                    break
                case 'jurorRegistry':
                    address = CONTRACT_ADDRESSES.JUROR_REGISTRY
                    abi = JurorRegistryABI.abi
                    break
                case 'token':
                case 'governanceToken':
                    address = CONTRACT_ADDRESSES.GOVERNANCE_TOKEN
                    abi = GovernanceTokenABI.abi
                    break
                default:
                    console.error(`❌ Unknown contract: ${contractName}`)
                    return null
            }

            if (!address || address.length === 0) {
                console.error(`❌ Contract address not configured: ${contractName}`)
                console.error(`Please check .env file`)
                return null
            }

            const contract = new ethers.Contract(
                address,
                abi,
                signer || provider
            )

            console.log(`✅ ${contractName} loaded:`, address.slice(0, 6) + '...' + address.slice(-4))

            return contract
        } catch (error) {
            console.error(`❌ Error loading ${contractName}:`, error)
            return null
        }
    }, [provider, signer, contractName])
}
