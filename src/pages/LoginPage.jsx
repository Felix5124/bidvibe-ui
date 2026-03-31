import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { loginWithGoogle, isLoading, error, user } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isEmailMode, setIsEmailMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Thêm state loading cho form email

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // Trigger Google OAuth login flow.
  const handleGoogleLogin = async () => {
    console.info('[LoginPage] Starting Google login flow')
    await loginWithGoogle()
  }

  // Handle email/password submit (placeholder flow in current UI).
  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Giả lập gọi API - Thay thế bằng logic đăng nhập thật của bạn
    setTimeout(() => {
      setIsSubmitting(false)
      console.info('[LoginPage] Email login placeholder submit', { email, hasPassword: Boolean(password) })
    }, 1500)
  }

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Cột trái: Branding & Illustration (Giữ nguyên phong cách Vibe nhưng làm mượt hơn) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 mix-blend-overlay"></div>
        
        {/* Abstract Blobs */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-4xl font-extrabold tracking-tight">BidVibe</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Discover & Bid on<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-white">Unique Items</span>
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-md font-light leading-relaxed">
            Join thousands of buyers and sellers on the premier online auction platform. Find rare treasures and great deals every day.
          </p>
          <div className="flex items-center gap-5 bg-white/10 backdrop-blur-md p-4 rounded-2xl w-fit border border-white/10">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-indigo-800 flex items-center justify-center text-sm font-bold shadow-sm">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-indigo-50">
              <span className="font-bold text-white text-lg">10,000+</span>
              <span className="block text-sm opacity-80">Active users bidding</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Nút Back to Home (Tùy chọn) */}
        <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 hidden sm:flex items-center gap-2 transition">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           Trang chủ
        </button>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-3xl font-extrabold text-gray-900">BidVibe</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {isEmailMode ? 'Welcome back' : 'Sign in to BidVibe'}
              </h2>
              <p className="mt-3 text-gray-500">
                {isEmailMode 
                  ? 'Enter your credentials to access your account' 
                  : 'Choose your preferred sign-in method'}
              </p>
            </div>

            {!isEmailMode ? (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-400 font-medium">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEmailMode(true)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Continue with Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all duration-200"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition-colors" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3.5 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200 shadow-lg shadow-indigo-600/30 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Sign In'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsEmailMode(false)}
                  className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Back to other options
                </button>
              </form>
            )}

            {error && (
              <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">Sign up for free</a>
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-600 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-gray-600 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}