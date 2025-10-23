import React from 'react'
import { motion } from 'framer-motion'

const StatCard = ({ icon: Icon, label, value, color = 'blue', index = 0 }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="card"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                </div>
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </motion.div>
    )
}

export default StatCard
