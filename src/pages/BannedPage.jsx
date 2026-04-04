import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function BannedPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      // Redirect to login page after logout
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Tài khoản đã bị khóa
        </h1>
        <p className="text-gray-600 mb-2">
          Tài khoản của bạn đã bị khóa bởi quản trị viên.
        </p>
        <p className="text-gray-600 mb-6">
          Vui lòng liên hệ <a href="mailto:support@bidvibe.com" className="text-blue-600 hover:text-blue-700 font-medium">support@bidvibe.com</a> để được hỗ trợ.
        </p>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Đăng xuất
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Đăng xuất để thử đăng nhập bằng tài khoản khác
          </p>
        </div>
      </div>
    </div>
  )
}