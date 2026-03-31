import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-blue-600">BidVibe</h1>
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Trang chủ
              </Link>
              <Link to="/sessions" className="text-gray-700 hover:text-blue-600 font-medium">
                Phiên đấu giá
              </Link>
              <Link to="/market" className="text-gray-700 hover:text-blue-600 font-medium">
                Chợ Đen
              </Link>
              <Link to="/me/inventory" className="text-gray-700 hover:text-blue-600 font-medium">
                Kho đồ
              </Link>
              <Link to="/me/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                Ho so
              </Link>
              {user?.role === 'ADMIN' ? (
                <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium">
                  Dashboard
                </Link>
              ) : (
                <Link to="/me/wallet" className="text-gray-700 hover:text-blue-600 font-medium">
                  Ví tiền
                </Link>
              )}
              <Link to="/me/notifications" className="text-gray-700 hover:text-blue-600 font-medium">
                Thong bao
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.email}</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
              </span>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Chào mừng đến với BidVibe!</h1>
          <p className="text-xl mb-6">
            Sàn đấu giá vật phẩm trực tuyến - Nơi bạn có thể ký gửi đồ, tham gia đấu giá và mua bán với cộng đồng.
          </p>
          <div className="flex space-x-4">
            <Link
              to="/sessions"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Xem phiên đấu giá
            </Link>
            <Link
              to="/items/submit"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10"
            >
              Ký gửi đồ
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Số dư ví</h3>
            <p className="text-3xl font-bold text-green-600">0 ₫</p>
            <Link to="/me/wallet" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Nạp tiền ngay →
            </Link>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Đồ đang theo dõi</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <Link to="/me/watchlist" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Xem watchlist →
            </Link>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Điểm uy tín</h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-yellow-600">5.0</div>
              <div className="ml-3 text-yellow-500">★★★★★</div>
            </div>
            <p className="text-gray-600 text-sm mt-2">Tài khoản mới</p>
            <Link to="/transactions/sample-id/rate" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Tao danh gia mau →
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏷️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Đấu giá Tăng dần</h3>
            <p className="text-gray-600">
              Trả giá lên dần, ai đặt cao nhất khi hết giờ sẽ thắng. Có tính năng Popcorn Bidding tự động kéo dài thời gian.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📉</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Đấu giá Giảm dần</h3>
            <p className="text-gray-600">
              Giá bắt đầu cao và tự động giảm dần. Người đầu tiên nhấn "MUA" sẽ thắng ngay với giá hiện tại.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤫</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Đấu giá Kín</h3>
            <p className="text-gray-600">
              Mỗi người đặt một giá bí mật. Sau 24 giờ, hệ thống công bố kết quả và người đặt cao nhất thắng.
            </p>
          </div>
        </div>

        {/* Admin Access Notice */}
        {user?.role === 'ADMIN' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-800 font-semibold mr-2">⚠️ Bạn có quyền Quản trị viên</span>
              <Link
                to="/admin"
                className="ml-auto bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm"
              >
                Truy cập Admin Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">BidVibe</h2>
              <p className="text-gray-400 mt-2">Sàn đấu giá vật phẩm trực tuyến</p>
            </div>
            <div className="text-gray-400 text-sm">
              <p>© 2025 BidVibe. Tất cả quyền được bảo lưu.</p>
              <p className="mt-1">Liên hệ: support@bidvibe.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}