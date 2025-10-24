import React from 'react'
import { ExternalLink } from 'lucide-react'
import { getExplorerLink } from '../utils/constants'

const ExplorerLink = ({ type, value, children, className = '', chainId }) => {
    if (!value) return null

    const link = getExplorerLink(type, value, chainId)

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-accent-blue hover:text-accent-purple transition-colors ${className}`}
        >
            {children}
            <ExternalLink size={14} />
        </a>
    )
}

export default ExplorerLink
