import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { formatAddress } from '../utils/format'
import { Wallet, Menu, X, Scale, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { account, isConnected, connectWallet, disconnect } = useWallet()
    const location = useLocation()

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/dashboard', label: 'Proposals' },
        { path: '/juror', label: 'Become Juror' },
        { path: '/create-proposal', label: 'Create' },
        { path: '/admin', label: 'Admin' },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <nav className="glass sticky top-0 z-40 border-b">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src="/favicon.png" alt="JuryDAO" className="w-8 h-8" />
                        <span className="text-xl font-bold gradient-text">JuryDAO</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3 py-2 rounded-lg transition-all ${
                                    isActive(link.path)
                                        ? 'bg-accent-blue/10 text-accent-blue'
                                        : 'text-gray-400 hover:text-gray-100'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Wallet Button */}
                    <div className="flex items-center gap-3">
                        {isConnected ? (
                            <div className="flex items-center gap-2">
                                <button className="btn btn-secondary text-sm hidden sm:flex items-center gap-2">
                                    <Wallet size={16} />
                                    {formatAddress(account)}
                                </button>
                                <button
                                    onClick={disconnect}
                                    className="btn btn-secondary p-2"
                                    title="Disconnect"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={connectWallet} className="btn btn-primary text-sm">
                                Connect Wallet
                            </button>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-gray-100"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden border-t border-dark-border overflow-hidden"
                    >
                        <div className="p-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-lg transition-all ${
                                        isActive(link.path)
                                            ? 'bg-accent-blue/10 text-accent-blue'
                                            : 'text-gray-400 hover:bg-dark-hover'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

export default Navbar
