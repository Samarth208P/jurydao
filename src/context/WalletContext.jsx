import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { NETWORK } from '../config/contracts'
import toast from 'react-hot-toast'

const WalletContext = createContext()

export const useWallet = () => {
    const context = useContext(WalletContext)
    if (!context) throw new Error('useWallet must be used within WalletProvider')
    return context
}

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null)
    const [provider, setProvider] = useState(null)
    const [signer, setSigner] = useState(null)
    const [chainId, setChainId] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    useEffect(() => {
        checkConnection()
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', () => window.location.reload())
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
            }
        }
    }, [])

    const checkConnection = async () => {
        if (!window.ethereum) return

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
                setChainId(Number(network.chainId))
                setIsConnected(true)
                console.log('✅ Wallet connected:', address)
            }
        } catch (error) {
            console.error('Check connection error:', error.message)
        }
    }

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            disconnect()
        } else {
            window.location.reload()
        }
    }

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('Please install MetaMask!')
            return
        }

        setIsConnecting(true)
        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            await provider.send('eth_requestAccounts', [])

            const signer = await provider.getSigner()
            const address = await signer.getAddress()
            const network = await provider.getNetwork()
            const currentChainId = Number(network.chainId)

            if (currentChainId !== NETWORK.chainId) {
                await switchNetwork()
            }

            setProvider(provider)
            setSigner(signer)
            setAccount(address)
            setChainId(currentChainId)
            setIsConnected(true)

            console.log('✅ Connected:', address)
            toast.success('Wallet connected!')
        } catch (error) {
            console.error('Connect error:', error.message)
            toast.error('Connection failed')
        } finally {
            setIsConnecting(false)
        }
    }

    const switchNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${NETWORK.chainId.toString(16)}` }],
            })
        } catch (error) {
            if (error.code === 4902) {
                await addNetwork()
            } else {
                throw error
            }
        }
    }

    const addNetwork = async () => {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${NETWORK.chainId.toString(16)}`,
                chainName: NETWORK.name,
                rpcUrls: [NETWORK.rpcUrl],
                blockExplorerUrls: [NETWORK.blockExplorer],
                nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                },
            }],
        })
    }

    const disconnect = () => {
        setAccount(null)
        setProvider(null)
        setSigner(null)
        setChainId(null)
        setIsConnected(false)
        console.log('🔌 Disconnected')
    }

    return (
        <WalletContext.Provider
            value={{
                account,
                provider,
                signer,
                chainId,
                isConnected,
                isConnecting,
                connectWallet,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}
