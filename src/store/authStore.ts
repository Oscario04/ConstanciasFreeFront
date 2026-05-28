import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { clearSession, setSession, normalizeUserRole } from '@/lib/auth'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken?: string | null
  isAuthenticated: boolean
  login: (user: User, token: string, refreshToken?: string | null) => void
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, token, refreshToken) => {
        const normalizedUser = normalizeUserRole(user)
        setSession(token, refreshToken)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        set({ user: normalizedUser, token, refreshToken, isAuthenticated: true })
      },

      logout: () => {
        clearSession()
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user: normalizeUserRole(user) }),

      setToken: (token) => {
        setSession(token)
        set({ token, isAuthenticated: true })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)