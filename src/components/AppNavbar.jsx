import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navLinkClass = ({ isActive }) =>
  `font-medium transition-colors ${isActive ? 'text-blue-700' : 'text-gray-700 hover:text-blue-600'}`

export default function AppNavbar() {
  const { user, logout } = useAuthStore()

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
              <NavLink to="/me/notifications" className={navLinkClass}>Thông báo</NavLink>
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
