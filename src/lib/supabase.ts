import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please check .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Helper to get current session token
export const getSessionToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event)
  if (event === 'SIGNED_IN' && session) {
    // Store token in sessionStorage for API clients.
    sessionStorage.setItem('sb_jwt', session.access_token)
    sessionStorage.setItem('authToken', session.access_token)
  } else if (event === 'SIGNED_OUT') {
    sessionStorage.removeItem('sb_jwt')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('user')
  }
})