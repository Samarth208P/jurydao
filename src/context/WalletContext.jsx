import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const WalletContext = createContext()

export const useWallet = () => {
    const context = useContext(WalletContext)
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider')
    }
    return context
}

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null)
    const [provider, setProvider] = useState(null)
    const [signer, setSigner] = useState(null)
    const [chainId, setChainId] = useState(null)
    const [isConnecting, setIsConnecting] = useState(false)

    const BASE_SEPOLIA_CHAIN_ID = '0x14a34' // 84532 in hex

    useEffect(() => {
        checkConnection()
        setupEventListeners()
    }, [])

    const checkConnection = async () => {
        if (!window.ethereum) {
            return
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const accounts = await provider.listAccounts()

            if (accounts.length > 0) {
                const signer = await provider.getSigner()
                const address = await signer.getAddress()
                const network = await provider.getNetwork()

                setProvider(provider)
                setSigner(signer)
                setAccount(address)
                setChainId(network.chainId.toString())
            }
        } catch (error) {
            // Silent fail on initial check
        }
    }

    const setupEventListeners = () => {
        if (!window.ethereum) return

        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
    }

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            disconnect()
        } else {
            setAccount(accounts[0])
            toast.success('Account changed')
        }
    }

    const handleChainChanged = () => {
        window.location.reload()
    }

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('Please install MetaMask')
            return
        }

        setIsConnecting(true)
        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const accounts = await provider.send('eth_requestAccounts', [])

            if (accounts.length === 0) {
                throw new Error('No accounts found')
            }

            const signer = await provider.getSigner()
            const address = await signer.getAddress()
            const network = await provider.getNetwork()

            setProvider(provider)
            setSigner(signer)
            setAccount(address)
            setChainId(network.chainId.toString())

            // Check if on correct network
            if (network.chainId.toString() !== '84532') {
                await switchNetwork()
            } else {
                toast.success('Wallet connected!')
            }
        } catch (error) {
            if (error.code === 4001) {
                toast.error('Connection rejected')
            } else {
                toast.error('Failed to connect wallet')
            }
        } finally {
            setIsConnecting(false)
        }
    }

    const switchNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
            })
            toast.success('Switched to Base Sepolia')
        } catch (error) {
            if (error.code === 4902) {
                await addNetwork()
            } else {
                toast.error('Failed to switch network')
            }
        }
    }

    const addNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: BASE_SEPOLIA_CHAIN_ID,
                    chainName: 'Base Sepolia',
                    nativeCurrency: {
                        name: 'Ethereum',
                        symbol: 'ETH',
                        decimals: 18
                    },
                    rpcUrls: ['https://sepolia.base.org'],
                    blockExplorerUrls: ['https://sepolia.basescan.org']
                }]
            })
            toast.success('Base Sepolia network added!')
        } catch (error) {
            toast.error('Failed to add network')
        }
    }

    const disconnect = () => {
        setAccount(null)
        setProvider(null)
        setSigner(null)
        setChainId(null)
        toast.success('Wallet disconnected')
    }

    const isCorrectNetwork = chainId === '84532'
    const isConnected = !!account

    return (
        <WalletContext.Provider
            value={{
                account,
                provider,
                signer,
                chainId,
                isConnected,
                isCorrectNetwork,
                isConnecting,
                connectWallet,
                disconnect,
                switchNetwork,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}
