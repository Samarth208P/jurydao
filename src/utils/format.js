import { ethers } from 'ethers'

// Format wallet address to short version (0x1234...5678)
export const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Format token balance from Wei to readable format
export const formatBalance = (balance) => {
    if (!balance) return '0'
    return parseFloat(ethers.formatEther(balance)).toFixed(2)
}

// Format Unix timestamp to readable date
export const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

// Format time remaining until deadline
export const formatTimeLeft = (deadline) => {
    if (!deadline) return ''

    const now = Math.floor(Date.now() / 1000)
    const timeLeft = Number(deadline) - now

    if (timeLeft <= 0) return 'Ended'

    const days = Math.floor(timeLeft / 86400)
    const hours = Math.floor((timeLeft % 86400) / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

// Format proposal state to readable text
export const formatProposalState = (state) => {
    const states = ['Pending', 'Active', 'Defeated', 'Succeeded', 'Executed']
    return states[state] || 'Unknown'
}

// Calculate percentage (used in voting results)
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0
    return Math.round((value / total) * 100)
}

// Format large numbers with commas
export const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Format ETH amount (for display)
export const formatEth = (value) => {
    return parseFloat(ethers.formatEther(value)).toFixed(4)
}
