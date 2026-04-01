import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { getUnreadCount } from '../api/notifications'

const navLinkClass = ({ isActive }) =>
  `font-medium transition-colors ${isActive ? 'text-blue-700' : 'text-gray-700 hover:text-blue-600'}`

export default function AppNavbar() {
  const { user, logout } = useAuthStore()
  const { unreadCount, setUnreadCount } = useNotificationStore()

  // Fetch unread count on mount
  useEffect(() => {
    if (!user) return

    const fetchUnread = async () => {
      try {
        const response = await getUnreadCount()
        const count = response?.data?.data ?? response?.data ?? 0
        setUnreadCount(Number(count))
      } catch (err) {
        console.error('[AppNavbar] Failed to fetch unread count', err)
      }
    }

    fetchUnread()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user, setUnreadCount])

  return (
    <nav className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to={user ? '/' : '/login'} className="text-2xl font-bold text-blue-600">
            BidVibe
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" className={navLinkClass}>Trang chủ</NavLink>
              <NavLink to="/sessions" className={navLinkClass}>Phiên đấu giá</NavLink>
              <NavLink to="/market" className={navLinkClass}>Chợ đen</NavLink>
              <NavLink to="/me/inventory" className={navLinkClass}>Kho đồ</NavLink>
              <NavLink to="/me/profile" className={navLinkClass}>Hồ sơ</NavLink>
              {user.role === 'ADMIN' ? (
                <NavLink to="/admin" className={navLinkClass}>Bảng điều khiển</NavLink>
              ) : (
                <NavLink to="/me/wallet" className={navLinkClass}>Ví tiền</NavLink>
              )}
              <NavLink to="/me/notifications" className={({ isActive }) => `font-medium transition-colors flex items-center gap-1 ${isActive ? 'text-blue-700' : 'text-gray-700 hover:text-blue-600'}`}>
                <Bell size={18} />
                Thông báo
                {unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-700 font-medium">{user.email}</p>
                <p className="text-xs text-gray-500">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}