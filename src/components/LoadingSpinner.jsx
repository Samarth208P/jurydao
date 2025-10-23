import React from 'react'

const LoadingSpinner = ({ size = 'md', text = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`spinner ${sizes[size]}`}></div>
            {text && <p className="text-gray-400 text-sm">{text}</p>}
        </div>
    )
}

export default LoadingSpinner
