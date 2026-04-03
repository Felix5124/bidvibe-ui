import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGavel, faBolt, faShieldHalved, faCoins, faChartLine, faHandshake, faArrowTrendUp, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { getBalance } from '../api/wallet'
import { getWatchlist, getMyProfile } from '../api/users'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function HomePage() {
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
    <div className="bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-10 space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute top-8 right-10 hidden lg:flex items-center gap-3 text-cyan-200/80">
            <FontAwesomeIcon icon={faGavel} className="text-2xl animate-bounce" />
            <FontAwesomeIcon icon={faCoins} className="text-2xl animate-pulse" />
            <FontAwesomeIcon icon={faArrowTrendUp} className="text-2xl animate-bounce [animation-delay:250ms]" />
          </div>

          <div className="relative grid grid-cols-1 gap-10 px-6 py-10 md:px-10 lg:grid-cols-12 lg:items-center lg:py-14">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
                Nền tảng đấu giá vật phẩm số và sưu tầm
              </p>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
                <span className="block text-cyan-300">Mua bán minh bạch, đấu giá công bằng, trải nghiệm thời gian thực.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base text-slate-200 md:text-lg">
                BidVibe là hệ sinh thái đấu giá trực tuyến cho cộng đồng đam mê sưu tầm: từ ký gửi vật phẩm, mở phiên đấu giá,
                theo dõi cạnh tranh theo thời gian thực đến thanh toán và xác nhận giao dịch.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/sessions" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                  Khám phá phiên đấu giá
                </Link>
                <Link to="/items/submit" className="rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/20 transition-colors">
                  Ký gửi vật phẩm ngay
                </Link>
                <Link to="/market" className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20 transition-colors">
                  Vào chợ đen cộng đồng
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBolt} className="text-amber-300" />
                  Cập nhật giá theo thời gian thực
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-300" />
                  Luồng giao dịch minh bạch
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faHandshake} className="text-sky-300" />
                  Cơ chế đánh giá uy tín
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <h2 className="text-lg font-bold">Bảng nhanh tài khoản</h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-100">Tổng số dư ví</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-200">{loading ? 'Đang tải...' : formatVnd(balance?.totalBalance)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-indigo-200/20 bg-indigo-300/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-indigo-100">Đang theo dõi</p>
                      <p className="mt-1 text-2xl font-bold text-indigo-100">{loading ? '...' : watchlistCount}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200/20 bg-amber-300/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-amber-100">Uy tín</p>
                      <p className="mt-1 text-2xl font-bold text-amber-100">{loading ? '...' : reputation}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-200">Xếp hạng: {renderStars(reputation)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><FontAwesomeIcon icon={faGavel} className="text-indigo-500" />Ký gửi nhanh</h3>
            <p className="mt-2 text-sm text-slate-600">Đăng vật phẩm trong vài bước, theo dõi duyệt và trạng thái trực tiếp trên hệ thống.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><FontAwesomeIcon icon={faBolt} className="text-amber-500" />Đấu giá trực tiếp</h3>
            <p className="mt-2 text-sm text-slate-600">Giá, lịch sử bid và trò chuyện cập nhật theo thời gian thực trong cùng một phòng đấu giá.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><FontAwesomeIcon icon={faCoins} className="text-emerald-500" />Thanh toán có kiểm soát</h3>
            <p className="mt-2 text-sm text-slate-600">Luồng ví tiền minh bạch với xác nhận giao dịch và lịch sử truy vết đầy đủ.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><FontAwesomeIcon icon={faChartLine} className="text-fuchsia-500" />Uy tín cộng đồng</h3>
            <p className="mt-2 text-sm text-slate-600">Điểm uy tín và hệ thống đánh giá giúp tăng độ tin cậy giữa người mua và người bán.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">BidVibe hoạt động như thế nào?</h2>
              <p className="mt-2 text-slate-600">Một hành trình đầy đủ từ lúc đăng bán đến khi chốt giao dịch.</p>
            </div>
            <Link to="/sessions" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Xem phiên đang mở →</Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-bold text-indigo-600">BƯỚC 1</p>
              <h3 className="mt-1 font-bold text-slate-900">Ký gửi vật phẩm</h3>
              <p className="mt-2 text-sm text-slate-600">Người dùng đăng sản phẩm, cung cấp mô tả và hình ảnh để chờ duyệt.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-bold text-indigo-600">BƯỚC 2</p>
              <h3 className="mt-1 font-bold text-slate-900">Quản trị duyệt phiên</h3>
              <p className="mt-2 text-sm text-slate-600">Admin duyệt vật phẩm, xếp vào phiên phù hợp và thiết lập quy tắc giá.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-bold text-indigo-600">BƯỚC 3</p>
              <h3 className="mt-1 font-bold text-slate-900">Đấu giá thời gian thực</h3>
              <p className="mt-2 text-sm text-slate-600">Người tham gia đặt giá, đặt giá ủy quyền hoặc mua ngay tùy loại phiên.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-bold text-indigo-600">BƯỚC 4</p>
              <h3 className="mt-1 font-bold text-slate-900">Chốt giao dịch</h3>
              <p className="mt-2 text-sm text-slate-600">Hệ thống cập nhật người thắng, ghi nhận giao dịch ví và theo dõi hậu mãi.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="inline-flex rounded-full bg-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-900">Đấu giá tăng dần</h3>
            <p className="mt-3 text-sm text-emerald-900/80">Người trả giá cao nhất tại thời điểm kết thúc sẽ thắng. Phù hợp với vật phẩm có tính cạnh tranh cao.</p>
          </article>
          <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h3 className="inline-flex rounded-full bg-rose-200 px-3 py-1 text-sm font-semibold text-rose-900">Đấu giá giảm dần</h3>
            <p className="mt-3 text-sm text-rose-900/80">Giá giảm theo thời gian, người mua đúng thời điểm sẽ chốt được mức giá tối ưu.</p>
          </article>
          <article className="rounded-2xl border border-slate-300 bg-slate-100 p-6">
            <h3 className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-900">Đấu giá kín</h3>
            <p className="mt-3 text-sm text-slate-700">Người tham gia gửi giá kín, hệ thống mở kết quả theo lịch để đảm bảo công bằng.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-indigo-200 bg-linear-to-r from-indigo-50 via-white to-cyan-50 p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Sẵn sàng bắt đầu phiên giao dịch đầu tiên của bạn?</h2>
              <p className="mt-2 text-slate-600">Tạo vật phẩm, theo dõi phiên đấu giá hoặc tham gia mua ngay trên chợ đen chỉ trong vài phút.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link to="/items/submit" className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Ký gửi ngay
              </Link>
              <Link to="/me/inventory" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Mở kho đồ
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
