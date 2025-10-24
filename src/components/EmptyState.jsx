import React from 'react'
import { Inbox } from 'lucide-react'
import { motion } from 'framer-motion'

const EmptyState = ({ message = 'No items found', icon: Icon = Inbox }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20 px-4"
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-6 p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full backdrop-blur-xl border border-blue-500/20"
            >
                <Icon size={64} className="text-gray-400" />
            </motion.div>
            <p className="text-gray-400 text-lg text-center max-w-md">
                {message}
            </p>
        </motion.div>
    )
}

export default EmptyState
