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

// Helper to upload file to Supabase Storage
export const uploadFileToSupabase = async (bucket: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw error
  }

  // Lấy public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}