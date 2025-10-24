import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

const NumberInput = ({ value, onChange, min = 1, max = 100, label, description, compact = false }) => {
    const handleIncrement = () => {
        if (value < max) onChange(value + 1)
    }

    const handleDecrement = () => {
        if (value > min) onChange(value - 1)
    }

    const handleSliderChange = (e) => {
        onChange(Number(e.target.value))
    }

    const percentage = ((value - min) / (max - min)) * 100

    return (
        <div className="space-y-3">
            {label && (
                <div>
                    <label className="block text-sm font-semibold mb-1">{label}</label>
                    {description && (
                        <p className="text-xs text-gray-400">{description}</p>
                    )}
                </div>
            )}

            {/* Value Display with Controls */}
            <div className="flex items-center gap-3">
                {/* Decrement Button */}
                <motion.button
                    type="button"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 hover:border-blue-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
                >
                    <Minus size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                </motion.button>

                {/* Value Display */}
                <div className="flex-1 text-center">
                    <motion.div
                        key={value}
                        initial={{ scale: 1.2, color: '#3b82f6' }}
                        animate={{ scale: 1, color: '#f9fafb' }}
                        className={compact ? "text-3xl font-bold" : "text-5xl font-bold"}
                    >
                        {value}
                    </motion.div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {min} - {max}
                    </div>
                </div>

                {/* Increment Button */}
                <motion.button
                    type="button"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 hover:border-blue-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
                >
                    <Plus size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                </motion.button>
            </div>

            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                        background: `linear-gradient(to right, 
                            rgb(59, 130, 246) 0%, 
                            rgb(59, 130, 246) ${percentage}%, 
                            rgb(55, 65, 81) ${percentage}%, 
                            rgb(55, 65, 81) 100%)`
                    }}
                />
            </div>
        </div>
    )
}

export default NumberInput
