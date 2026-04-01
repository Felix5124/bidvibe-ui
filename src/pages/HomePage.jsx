import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getBalance } from '../api/wallet'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function HomePage() {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const response = await getBalance()
        setBalance(readApiData(response))
      } catch (err) {
        console.error('[HomePage] Failed to load wallet balance', err)
      } finally {
        setLoading(false)
      }
    }
    loadBalance()
  }, [])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' ₫'
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
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
            {loading ? (
              <p className="text-3xl font-bold text-gray-400">Đang tải...</p>
            ) : (
              <p className="text-3xl font-bold text-green-600">{formatVnd(balance?.totalBalance)}</p>
            )}
            <Link to="/me/wallet" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Nạp tiền ngay →
            </Link>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Đồ đang theo dõi</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <Link to="/me/watchlist" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Xem danh sách theo dõi →
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
              Tạo đánh giá mẫu →
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
