import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { buyListing, cancelListing, getListingDetail } from '../api/market'
import { useAuthStore } from '../store/authStore'
import { formatVND } from '../utils/formatVND'
import PageHeaderFrame from '../components/PageHeaderFrame'
import { formatRarity } from '../utils/rarity'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function MarketDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)

  const isSeller = useMemo(() => user?.id && listing?.seller?.id && user.id === listing.seller.id, [listing, user])
  const isBuyer = useMemo(() => user?.id && listing?.buyer?.id && user.id === listing.buyer.id, [listing, user])
  const productImages = useMemo(() => {
    const urls = listing?.item?.imageUrls
    return Array.isArray(urls) ? urls.filter(Boolean) : []
  }, [listing])

  // Load listing detail card info.
  const loadDetail = useCallback(async () => {
    const response = await getListingDetail(listingId)
    setListing(readApiData(response))
  }, [listingId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        await loadDetail()
      } catch (err) {
        console.error('[MarketDetailPage] Failed to load listing detail', err)
        setError(err?.response?.data?.message || 'Không tải được chi tiết listing.')
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      load()
    }
  }, [listingId, loadDetail])

  useEffect(() => {
    setActiveImage(0)
  }, [listingId])

  // Buy current listing at asking price.
  const handleBuy = async () => {
    try {
      await buyListing(listingId)
      toast.success('Mua vật phẩm thành công!')
      await loadDetail()
    } catch (err) {
      console.error('[MarketDetailPage] Failed to buy listing', err)
      toast.error(err?.response?.data?.message || 'Mua vật phẩm thất bại.')
    }
  }

  // Cancel listing if current user is seller.
  const handleCancelListing = async () => {
    try {
      await cancelListing(listingId)
      toast.success('Đã hủy niêm yết.')
      navigate('/market')
    } catch (err) {
      console.error('[MarketDetailPage] Failed to cancel listing', err)
      toast.error(err?.response?.data?.message || 'Hủy niêm yết thất bại.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Chi tiết tin đăng"
          description="Theo dõi thông tin niêm yết và thực hiện giao dịch mua ngay an toàn."
        />

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>
        ) : listing && (
          <div>
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{listing.item?.name}</h2>
                  <p className="mt-2 text-gray-700">{listing.item?.description || 'Không có mo ta.'}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{listing.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <p>Seller: {listing.seller?.nickname || '-'}</p>
                <p>Phân loại: {formatRarity(listing.item?.rarity)}</p>
                <p>Gia niem yet: <span className="font-semibold text-emerald-700">{formatVND(listing.askingPrice)}</span></p>
                <p>Buyer: {listing.buyer?.nickname || '-'}</p>
              </div>

              <div className="mt-5">
                {productImages.length > 0 ? (
                  <>
                    <div className="overflow-hidden h-100 w-100 rounded-xl border border-gray-200 bg-gray-50 mx-auto">
                      <img
                        src={productImages[activeImage]}
                        alt={listing.item?.name || 'Ảnh vật phẩm'}
                        className="h-100 w-100 object-cover"
                      />
                    </div>
                    {productImages.length > 1 && (
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {productImages.map((url, index) => (
                          <button
                            key={`${url}-${index}`}
                            type="button"
                            onClick={() => setActiveImage(index)}
                            className={`overflow-hidden rounded-lg border ${activeImage === index ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'}`}
                          >
                            <img src={url} alt={`Thumbnail ${index + 1}`} className="h-100 w-100 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                    Chưa có ảnh cho sản phẩm này.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleBuy}
                disabled={listing.status !== 'ACTIVE'}
                className="mt-5 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Mua ngay
              </button>

              {isSeller && (
                <button
                  type="button"
                  onClick={handleCancelListing}
                  disabled={listing.status !== 'ACTIVE'}
                  className="mt-3 ml-3 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Huy listing
                </button>
              )}

              {/* Rate seller section - shown to buyer after purchase */}
              {listing.status === 'SOLD' && isBuyer && listing.seller && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-semibold text-emerald-800 mb-2">Giao dịch hoàn tất</h3>
                  <p className="text-sm text-emerald-700 mb-3">
                    Đánh giá người bán <span className="font-medium">{listing.seller.nickname || 'người dùng'}</span> về giao dịch này.
                  </p>
                  <Link
                    to={`/transactions/${listingId}/rate?marketListingId=${listingId}&toUserName=${encodeURIComponent(listing.seller.nickname || '')}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Đánh giá người bán
                  </Link>
                </div>
              )}

              {/* Rate buyer section - shown to seller after sale */}
              {listing.status === 'SOLD' && isSeller && listing.buyer && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Vật phẩm đã bán</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Người mua: <span className="font-medium">{listing.buyer.nickname || 'người dùng'}</span> với giá {formatVND(listing.askingPrice)}
                  </p>
                  <Link
                    to={`/transactions/${listingId}/rate?marketListingId=${listingId}&toUserName=${encodeURIComponent(listing.buyer.nickname || '')}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Đánh giá người mua
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

