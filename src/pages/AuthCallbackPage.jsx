import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { fetchUserProfile } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase auto‑detects session from URL and saves it
      // Wait a moment for the session to be established
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Fetch user profile from backend
        await fetchUserProfile()
        navigate('/')
      } else {
        // No session, redirect to login
        navigate('/login')
      }
    }
    handleCallback()
  }, [navigate, fetchUserProfile])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-700">Completing sign‑in…</p>
      </div>
    </div>
  )
}