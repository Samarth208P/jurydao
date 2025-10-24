import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { Wallet, Home, FileText, Users, Settings, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
    const location = useLocation()
    const { account, isConnected, connectWallet, disconnect, isCorrectNetwork } = useWallet()
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    const formatAddress = (address) => {
        if (!address) return ''
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/dashboard', label: 'Proposals', icon: FileText },
        { path: '/juror', label: 'Juror', icon: Users },
        { path: '/admin', label: 'Admin', icon: Settings },
    ]

    return (
        <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                        >
                            <img
                                src="/favicon.png"
                                alt="JuryDAO Logo"
                                className="w-10 h-10 object-contain"
                            />
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                        </motion.div>
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-200 to-rose-400 bg-clip-text text-transparent">
                            JuryDAO
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="relative px-4 py-2 rounded-xl transition-all duration-300 group"
                                >
                                    <div className={`flex items-center gap-2 transition-all ${
                                        isActive
                                            ? 'text-blue-400'
                                            : 'text-gray-400 group-hover:text-white'
                                    }`}>
                                        <Icon size={18} />
                                        <span className="font-medium">{item.label}</span>
                                    </div>

                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-blue-500/10 rounded-xl border border-blue-500/30"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}

                                    {/* Hover effect */}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-gray-800/0 group-hover:bg-gray-800/50 rounded-xl transition-colors duration-300" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Wallet Button */}
                    <div className="flex items-center gap-3">
                        {!isConnected ? (
                            <motion.button
                                onClick={connectWallet}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-primary flex items-center gap-2 relative overflow-hidden"
                            >
                                <Wallet size={18} />
                                <span>Connect</span>
                            </motion.button>
                        ) : (
                            <div className="flex items-center gap-3">
                                {!isCorrectNetwork && (
                                    <motion.span
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-xs text-yellow-500 font-semibold"
                                    >
                                        Wrong Network
                                    </motion.span>
                                )}
                                <motion.button
                                    onClick={disconnect}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white hover:border-blue-500/50 transition-all duration-300 flex items-center gap-2 group overflow-hidden"
                                >
                                    <Wallet size={18} className="text-blue-400" />
                                    <span className="font-mono text-sm">{formatAddress(account)}</span>

                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden border-t border-gray-800/50 overflow-hidden"
                        >
                            <div className="py-4 space-y-2">
                                {navItems.map((item, index) => {
                                    const Icon = item.icon
                                    const isActive = location.pathname === item.path

                                    return (
                                        <motion.div
                                            key={item.path}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Link
                                                to={item.path}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                    isActive
                                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                                                }`}
                                            >
                                                <Icon size={20} />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    )
}

export default Navbar
