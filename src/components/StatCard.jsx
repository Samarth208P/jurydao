import React from 'react'
import { motion } from 'framer-motion'

const StatCard = ({ icon: Icon, label, value, color = 'blue', index = 0 }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 text-blue-400',
        green: 'from-green-500 to-green-600 text-green-400',
        purple: 'from-purple-500 to-purple-600 text-purple-400',
        red: 'from-red-500 to-red-600 text-red-400',
        orange: 'from-orange-500 to-orange-600 text-orange-400',
        pink: 'from-pink-500 to-pink-600 text-pink-400',
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="card group relative overflow-hidden"
        >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm font-medium">{label}</span>
                    <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`p-2 bg-gradient-to-br ${colorClasses[color]} bg-opacity-10 rounded-lg`}
                    >
                        <Icon size={20} className={colorClasses[color].split(' ')[2]} />
                    </motion.div>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className={`text-3xl font-bold ${colorClasses[color].split(' ')[2]}`}
                >
                    {value}
                </motion.div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl animate-pulse" />
            </div>
        </motion.div>
    )
}

export default StatCard
