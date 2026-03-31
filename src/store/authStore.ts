import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/base'
import { User } from '../lib/base'
import { logError } from '../lib/logger'

interface AuthStore {
  user: User | null
  isLoading: boolean
  error: string | null
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  fetchUserProfile: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  // Start OAuth login flow via Google and redirect to callback.
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // Redirect happens, no further action needed
    } catch (err: any) {
      logError('AuthStore', 'Google login failed', err)
      set({ error: err.message || 'Login failed' })
    } finally {
      set({ isLoading: false })
    }
  },

  // Sign out from Supabase and clear local client auth state.
  logout: async () => {
    set({ isLoading: true })
    try {
      await supabase.auth.signOut()
      // Ensure local storage cleaned up (Supabase listener may do it, but just in case)
      localStorage.removeItem('sb_jwt')
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      set({ user: null })
    } catch (err: any) {
      logError('AuthStore', 'Logout failed', err)
      set({ error: err.message || 'Logout failed' })
    } finally {
      set({ isLoading: false })
    }
  },

  // Load authenticated user profile from backend.
  fetchUserProfile: async () => {
    set({ isLoading: true })
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        set({ user: null })
        return
      }
      // Call backend /api/users/me to get user profile
      const response = await apiClient.get('/api/users/me')
      // The backend returns ApiResponse<UserProfileResponse>
      // We need to extract the data field from the response
      const userData = response.data?.data || response.data
      set({ user: userData })
    } catch (err: any) {
      logError('AuthStore', 'Failed to fetch user profile', err)
      set({ user: null })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))