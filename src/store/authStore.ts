import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/base'
import { User } from '../lib/base'

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
      set({ error: err.message || 'Login failed' })
    } finally {
      set({ isLoading: false })
    }
  },

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
      set({ error: err.message || 'Logout failed' })
    } finally {
      set({ isLoading: false })
    }
  },

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
      console.error('Failed to fetch user profile:', err)
      set({ user: null })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))