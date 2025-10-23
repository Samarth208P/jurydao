import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from './context/WalletContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CreateProposal from './pages/CreateProposal'
import ProposalDetail from './pages/ProposalDetail'
import JurorPage from './pages/JurorPage'
import AdminPanel from './pages/AdminPanel'

function App() {
    return (
        <Router>
            <WalletProvider>
                <div className="min-h-screen bg-dark-bg">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/create-proposal" element={<CreateProposal />} />
                        <Route path="/proposal/:id" element={<ProposalDetail />} />
                        <Route path="/juror" element={<JurorPage />} />
                        <Route path="/admin" element={<AdminPanel />} />
                    </Routes>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#13151a',
                                color: '#fff',
                                border: '1px solid #1f2937',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </div>
            </WalletProvider>
        </Router>
    )
}

export default App
