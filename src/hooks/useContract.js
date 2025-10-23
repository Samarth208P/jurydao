import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { CONTRACTS } from '../config/contracts'

import GovernanceTokenABI from '../contracts/GovernanceToken.json'
import JurorRegistryABI from '../contracts/JurorRegistry.json'
import GovernorSortitionABI from '../contracts/GovernorSortition.json'

const ABIS = {
    token: GovernanceTokenABI,
    registry: JurorRegistryABI,
    governor: GovernorSortitionABI,
}

const ADDRESSES = {
    token: CONTRACTS.GOVERNANCE_TOKEN,
    registry: CONTRACTS.JUROR_REGISTRY,
    governor: CONTRACTS.GOVERNOR_SORTITION,
}

export const useContract = (contractName) => {
    const [contract, setContract] = useState(null)
    const { signer, provider } = useWallet()

    useEffect(() => {
        if (!ADDRESSES[contractName]) {
            console.warn(`⚠️ ${contractName} address not set`)
            return
        }

        try {
            const providerOrSigner = signer || provider
            if (!providerOrSigner) return

            const instance = new ethers.Contract(
                ADDRESSES[contractName],
                ABIS[contractName],
                providerOrSigner
            )

            setContract(instance)
            console.log(`📝 ${contractName} contract loaded`)
        } catch (error) {
            console.error(`Error loading ${contractName}:`, error.message)
        }
    }, [contractName, signer, provider])

    return contract
}
