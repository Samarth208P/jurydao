import React from 'react'
import { motion } from 'framer-motion'

const StatCard = ({ icon: Icon, label, value, subtitle, color = 'blue', index = 0 }) => {
    const colorClasses = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        red: 'text-red-500',
        purple: 'text-purple-500',
        yellow: 'text-yellow-500',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="card"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">{label}</span>
                <Icon className={colorClasses[color]} size={20} />
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1">{value}</div>
            {subtitle && (
                <div className="text-xs text-gray-500">{subtitle}</div>
            )}
        </motion.div>
    )
}

export default StatCard
