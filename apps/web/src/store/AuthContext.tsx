import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { authApi } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('mhub_token')
    console.log('AuthContext - Token from localStorage:', token ? 'exists' : 'none')
    if (!token) {
      setState(s => ({ ...s, isLoading: false }))
      return
    }
    console.log('AuthContext - Calling authApi.me()')
    authApi.me()
      .then(({ user }) => {
        console.log('AuthContext - User data received:', user)
        setState({ user, token, isLoading: false })
      })
      .catch((err) => {
        console.error('AuthContext - Error getting user data:', err)
        localStorage.removeItem('mhub_token')
        setState({ user: null, token: null, isLoading: false })
      })
  }, [])

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem('mhub_token', token)
    setState({ user, token, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mhub_token')
    setState({ user: null, token: null, isLoading: false })
  }, [])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('mhub_token')
    if (!token) return
    const { user } = await authApi.me()
    setState(s => ({ ...s, user }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
