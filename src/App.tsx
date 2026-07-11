import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ReceivePage from './pages/ReceivePage'
import ThawPage from './pages/ThawPage'
import TankDashboardPage from './pages/TankDashboardPage'
import WithdrawPage from './pages/WithdrawPage'
import TraceabilityPage from './pages/TraceabilityPage'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/receive" element={
        <ProtectedRoute roles={['WAREHOUSE', 'MANAGER', 'ADMIN']}>
          <Layout><ReceivePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/thaw" element={
        <ProtectedRoute roles={['WAREHOUSE', 'MANAGER', 'ADMIN']}>
          <Layout><ThawPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/tanks" element={
        <ProtectedRoute>
          <Layout><TankDashboardPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/withdraw" element={
        <ProtectedRoute roles={['PRODUCTION', 'MANAGER', 'ADMIN']}>
          <Layout><WithdrawPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/traceability" element={
        <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
          <Layout><TraceabilityPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}