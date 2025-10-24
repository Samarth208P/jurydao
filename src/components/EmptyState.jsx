import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { motion } from 'framer-motion'

const EmptyState = ({ title, description, action, icon: Icon = FileQuestion }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-6">
                <Icon size={40} className="text-gray-500" />
            </div>

            <h3 className="text-2xl font-bold mb-2 text-center">{title}</h3>
            <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>

            {action && (
                <Link to={action.to} className="btn btn-primary">
                    {action.label}
                </Link>
            )}
        </motion.div>
    )
}

export default EmptyState
