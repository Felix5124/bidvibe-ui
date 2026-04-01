// Authentication APIs
// NOTE: Authentication is handled by Supabase, not by the Spring Backend.
// The endpoints below are NOT implemented in the backend.
//
// For authentication, use the Supabase client directly:
// - Login: supabase.auth.signInWithOAuth({ provider: 'google' })
// - Logout: supabase.auth.signOut()
// - Get Session: supabase.auth.getSession()
// - Refresh: supabase.auth.refreshSession()
//
// See src/lib/supabase.ts and src/store/authStore.ts for actual auth implementation.

import { supabase } from '../lib/supabase'

/**
 * Get current session token from Supabase
 * @returns {Promise<string|null>} Access token or null
 */
export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<void>}
 */
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
}

/**
 * Sign out from Supabase
 * @returns {Promise<void>}
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  sessionStorage.removeItem('sb_jwt')
  sessionStorage.removeItem('authToken')
  sessionStorage.removeItem('user')
}

/**
 * Get current user from Supabase session
 * @returns {Promise<object|null>} User object or null
 */
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data.user || null
}

/**
 * Refresh the current session
 * @returns {Promise<object|null>} Session object or null
 */
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

export default {
  getAuthToken,
  loginWithGoogle,
  logout,
  getCurrentUser,
  refreshSession,
}