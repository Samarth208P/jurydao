export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    console.log('📋 Copied:', text)
}

export const openInExplorer = (address, type = 'address') => {
    const baseUrl = 'https://sepolia.basescan.org'
    window.open(`${baseUrl}/${type}/${address}`, '_blank')
}

export const validateProposalInput = (title, description) => {
    if (!title || title.trim().length < 5) {
        return 'Title must be at least 5 characters'
    }
    if (!description || description.trim().length < 20) {
        return 'Description must be at least 20 characters'
    }
    return null
}

export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0
    return Math.round((value / total) * 100)
}

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
