import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './store/AuthContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import MyTutorings from './pages/MyTutorings'
import Publish from './pages/Publish'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="spinner-center">
      <span className="spinner spinner-lg" aria-label="Cargando..." />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="spinner-center">
      <span className="spinner spinner-lg" aria-label="Cargando..." />
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="spinner-center">
      <span className="spinner spinner-lg" aria-label="Cargando..." />
    </div>
  )
  if (!user || user.rol !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={
        <Layout><Home /></Layout>
      } />

      <Route path="/login" element={
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      } />

      <Route path="/register" element={
        <PublicOnlyRoute>
          <Register />
        </PublicOnlyRoute>
      } />

      {/* Protected */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout><Dashboard /></Layout>
        </PrivateRoute>
      } />

      <Route path="/schedule" element={
        <PrivateRoute>
          <Layout><Schedule /></Layout>
        </PrivateRoute>
      } />

      <Route path="/my-tutorings" element={
        <PrivateRoute>
          <Layout><MyTutorings /></Layout>
        </PrivateRoute>
      } />

      <Route path="/publish" element={
        <PrivateRoute>
          <Layout><Publish /></Layout>
        </PrivateRoute>
      } />

      <Route path="/profile" element={
        <PrivateRoute>
          <Layout><Profile /></Layout>
        </PrivateRoute>
      } />

      <Route path="/admin" element={
        <AdminRoute>
          <Layout><Admin /></Layout>
        </AdminRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
