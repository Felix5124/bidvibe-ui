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

// Try to restore user from sessionStorage on initial load
const storedUser = sessionStorage.getItem('user')
const initialUser = storedUser ? JSON.parse(storedUser) : null

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: initialUser,
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
      // Ensure session storage cleaned up (Supabase listener may do it, but just in case)
      sessionStorage.removeItem('sb_jwt')
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('user')
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
      // First, try to get Supabase session
      let session = (await supabase.auth.getSession()).data.session
      
      // If no session, try to refresh it
      if (!session) {
        const refreshResult = await supabase.auth.refreshSession()
        session = refreshResult.data.session
      }
      
      if (!session) {
        // No valid session at all
        set({ user: null })
        return
      }
      
      // Update session storage with current token
      sessionStorage.setItem('sb_jwt', session.access_token)
      sessionStorage.setItem('authToken', session.access_token)
      
      // Lấy avatar từ Google session (metadata)
      const googleAvatar = session.user?.user_metadata?.avatar_url || null;

      // Call backend /api/users/me to get user profile
      const response = await apiClient.get('/api/users/me')
      const userData = response.data?.data || response.data
      
      // Gộp googleAvatar vào user state để UI sử dụng làm fallback
      const userWithAvatar = { ...userData, googleAvatar }
      set({ user: userWithAvatar })
      // Store in sessionStorage for persistence across page refresh
      sessionStorage.setItem('user', JSON.stringify(userWithAvatar))
    } catch (err: any) {
      logError('AuthStore', 'Failed to fetch user profile', err)
      
      // Check the type of error
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('Failed to fetch')) {
        // Network error - backend might be down
        // Don't clear user state, just log the error
        console.warn('Backend might be unavailable, keeping current user state')
      } else if (err.response?.status === 401) {
        // 401 Unauthorized - token expired or invalid
        // Try one more time to refresh Supabase session
        try {
          const refreshResult = await supabase.auth.refreshSession()
          if (refreshResult.data.session) {
            // We got a new session, retry the API call
            sessionStorage.setItem('sb_jwt', refreshResult.data.session.access_token)
            sessionStorage.setItem('authToken', refreshResult.data.session.access_token)
            
            const response = await apiClient.get('/api/users/me')
            const userData = response.data?.data || response.data
            const googleAvatar = refreshResult.data.session.user?.user_metadata?.avatar_url || null
            set({ user: { ...userData, googleAvatar } })
            return
          } else {
            // Refresh failed, clear session
            set({ user: null })
          }
        } catch (refreshError) {
          // Refresh also failed, clear session
          console.error('Refresh also failed:', refreshError)
          set({ user: null })
        }
      } else {
        // Other errors (500, 404, etc.)
        // Don't clear user for server errors
        console.warn('API error but keeping user state:', err.response?.status)
      }
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))