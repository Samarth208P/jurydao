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
            console.warn('⚠️ MetaMask not installed')
            return
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const accounts = await provider.listAccounts()

            if (accounts.length > 0) {
                const signer = await provider.getSigner()
                const network = await provider.getNetwork()

                setProvider(provider)
                setSigner(signer)
                setAccount(accounts[0].address)
                setChainId(network.chainId.toString())

                console.log('✅ Wallet already connected:', accounts[0].address)
                console.log('🔗 Chain ID:', network.chainId.toString())
            }
        } catch (error) {
            console.error('❌ Error checking connection:', error)
        }
    }

    const setupEventListeners = () => {
        if (!window.ethereum) return

        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)

        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
                window.ethereum.removeListener('chainChanged', handleChainChanged)
            }
        }
    }

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            disconnect()
            toast.error('Wallet disconnected')
        } else {
            setAccount(accounts[0])
            window.location.reload()
        }
    }

    const handleChainChanged = () => {
        window.location.reload()
    }

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask not installed!')
            window.open('https://metamask.io/download/', '_blank')
            return
        }

        setIsConnecting(true)

        try {
            console.log('🔄 Requesting wallet connection...')

            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            })

            console.log('✅ Accounts received:', accounts)

            // Create provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const network = await provider.getNetwork()

            console.log('✅ Network:', network.chainId.toString())

            setProvider(provider)
            setSigner(signer)
            setAccount(accounts[0])
            setChainId(network.chainId.toString())

            // Check if on Base Sepolia
            if (network.chainId.toString() !== '84532') {
                toast.error('Please switch to Base Sepolia network')
                await switchToBaseSepolia()
            } else {
                toast.success(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
            }
        } catch (error) {
            console.error('❌ Error connecting wallet:', error)

            if (error.code === 4001) {
                toast.error('Connection rejected by user')
            } else if (error.code === -32002) {
                toast.error('Connection request pending. Please check MetaMask.')
            } else {
                toast.error('Failed to connect wallet')
            }
        } finally {
            setIsConnecting(false)
        }
    }

    const switchToBaseSepolia = async () => {
        try {
            console.log('🔄 Switching to Base Sepolia...')

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
            })

            toast.success('Switched to Base Sepolia')
            window.location.reload()
        } catch (error) {
            console.error('❌ Switch network error:', error)

            // Chain not added to MetaMask
            if (error.code === 4902) {
                try {
                    console.log('➕ Adding Base Sepolia network...')

                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: BASE_SEPOLIA_CHAIN_ID,
                                chainName: 'Base Sepolia',
                                nativeCurrency: {
                                    name: 'Ethereum',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://sepolia.base.org'],
                                blockExplorerUrls: ['https://sepolia.basescan.org'],
                            },
                        ],
                    })

                    toast.success('Base Sepolia network added!')
                    window.location.reload()
                } catch (addError) {
                    console.error('❌ Error adding network:', addError)
                    toast.error('Failed to add Base Sepolia network')
                }
            } else {
                toast.error('Failed to switch network')
            }
        }
    }

    const disconnect = () => {
        setAccount(null)
        setProvider(null)
        setSigner(null)
        setChainId(null)
        console.log('👋 Wallet disconnected')
        toast.success('Wallet disconnected')
    }

    const isConnected = !!account
    const isCorrectNetwork = chainId === '84532'

    return (
        <WalletContext.Provider
            value={{
                account,
                provider,
                signer,
                chainId,
                isConnecting,
                isConnected,
                isCorrectNetwork,
                connectWallet,
                disconnect,
                switchToBaseSepolia,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}
