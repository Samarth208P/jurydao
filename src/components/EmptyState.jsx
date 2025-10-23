import React from 'react'
import { FileX } from 'lucide-react'

const EmptyState = ({ title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-dark-card border border-dark-border flex items-center justify-center mb-4">
                <FileX size={32} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-400 text-center mb-6 max-w-md">{description}</p>
            {action && action}
        </div>
    )
}

export default EmptyState
