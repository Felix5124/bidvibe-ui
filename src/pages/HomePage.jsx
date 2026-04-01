import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { getBalance } from '../api/wallet'
import { getWatchlist, getMyProfile } from '../api/users'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function HomePage() {
  const { user } = useAuthStore()
  const [balance, setBalance] = useState(null)
  const [watchlistCount, setWatchlistCount] = useState(0)
  const [reputation, setReputation] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [balanceRes, watchlistRes, profileRes] = await Promise.all([
          getBalance(),
          getWatchlist(0, 1),
          getMyProfile(),
        ])
        setBalance(readApiData(balanceRes))
        setWatchlistCount(readApiData(watchlistRes)?.meta?.totalElements || 0)
        setReputation(readApiData(profileRes)?.reputationScore ?? 0)
      } catch (err) {
        console.error('[HomePage] Failed to load data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' ₫'
  }

  const renderStars = (score) => {
    const fullStars = Math.min(5, Math.floor(score / 20))
    return (
      <span className="text-yellow-400">
        {'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)}
      </span>
    )
  }

  return (
    <div className="bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {user?.nickname ? `Xin chào, ${user.nickname}!` : 'Chào mừng đến với BidVibe!'}
          </h1>
          <p className="text-xl mb-6">
            Sàn đấu giá vật phẩm trực tuyến - Nơi bạn có thể ký gửi đồ, tham gia đấu giá và mua bán với cộng đồng.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/sessions"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Xem phiên đấu giá
            </Link>
            <Link
              to="/items/submit"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Ký gửi đồ
            </Link>
            <Link
              to="/market"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Chợ đen
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Số dư ví</h3>
            {loading ? (
              <p className="text-3xl font-bold text-gray-400">Đang tải...</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-green-600">{formatVnd(balance?.totalBalance)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Khả dụng: {formatVnd(balance?.balanceAvailable)}
                </p>
              </>
            )}
            <Link to="/me/wallet" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Nạp tiền ngay →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Đồ đang theo dõi</h3>
            {loading ? (
              <p className="text-3xl font-bold text-gray-400">...</p>
            ) : (
              <p className="text-3xl font-bold text-purple-600">{watchlistCount}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Vật phẩm bạn quan tâm</p>
            <Link to="/me/watchlist" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Xem danh sách →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Điểm uy tín</h3>
            {loading ? (
              <p className="text-3xl font-bold text-gray-400">...</p>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-yellow-600">{reputation}</span>
                {renderStars(reputation)}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {reputation >= 80 ? 'Uy tín cao' : reputation >= 50 ? 'Uy tín tốt' : reputation >= 20 ? 'Uy tín trung bình' : 'Tài khoản mới'}
            </p>
            <Link to="/me/profile" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Xem hồ sơ →
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 bg-green-100 p-2 text-center rounded-2xl">Đấu giá Tăng dần</h3>
            <p className="text-gray-600">
              Trả giá lên dần, ai đặt cao nhất khi hết giờ sẽ thắng. Có tính năng Popcorn Bidding tự động kéo dài thời gian.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 bg-red-200 p-2 text-center rounded-2xl">Đấu giá Giảm dần</h3>
            <p className="text-gray-600">
              Giá bắt đầu cao và tự động giảm dần. Người đầu tiên nhấn "MUA" sẽ thắng ngay với giá hiện tại.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 bg-gray-300 p-2 text-center rounded-2xl">Đấu giá Kín</h3>
            <p className="text-gray-600">
              Mỗi người đặt một giá bí mật. Sau 24 giờ, hệ thống công bố kết quả và người đặt cao nhất thắng.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
