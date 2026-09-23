import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/index.jsx'
import { Sidebar, Header } from './components/Shell.jsx'
import { Walkthrough } from './components/Walkthrough.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ChatBI from './pages/ChatBI.jsx'
import ReportDetail from './pages/ReportDetail.jsx'
import SemanticLayer from './pages/SemanticLayer.jsx'
import DataManagement from './pages/DataManagement.jsx'
import Drafts from './pages/Drafts.jsx'
import Help from './pages/Help.jsx'
import Onboarding from './pages/Onboarding.jsx'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="app-layout">
      <div className="app-sidebar">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className="app-main flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-slate-50">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <Walkthrough />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/chatbi" element={<ProtectedRoute><AppLayout><ChatBI /></AppLayout></ProtectedRoute>} />
      <Route path="/report/:id" element={<ProtectedRoute><AppLayout><ReportDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/semantic-layer" element={<ProtectedRoute><AppLayout><SemanticLayer /></AppLayout></ProtectedRoute>} />
      <Route path="/data-management" element={<ProtectedRoute><AppLayout><DataManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><AppLayout><Drafts /></AppLayout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><AppLayout><Help /></AppLayout></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><AppLayout><Onboarding /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
