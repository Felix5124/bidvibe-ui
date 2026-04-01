import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getItemDetail } from '../api/items'
import { getPriceHistory } from '../api/analytics'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function ItemDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load item info and its price history for analytics tab.
    const loadItem = async () => {
      setLoading(true)
      setError(null)
      try {
        const [itemRes, historyRes] = await Promise.all([
          getItemDetail(id),
          getPriceHistory(id),
        ])
        setItem(readApiData(itemRes))
        const historyData = readApiData(historyRes)
        setPriceHistory(historyData?.pricePoints || [])
      } catch (err) {
        console.error('[ItemDetailPage] Failed to load item detail/price history', err)
        setError(err?.response?.data?.message || 'Không tải được chi tiet vat pham.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadItem()
    }
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết vật phẩm</h1>
          <Link to="/me/inventory" className="text-blue-600 hover:text-blue-700 font-medium">
            Ve kho do
          </Link>
        </div>

        {loading && <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>}

        {!loading && error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && item && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{item.name}</h2>
                <p className="mt-2 text-gray-700">{item.description || 'Không có mo ta.'}</p>
              </div>
              <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">{item.status}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Thông tin cơ bản</h3>
                <p className="text-sm text-gray-700">Rarity: {item.rarity || '-'}</p>
                <p className="text-sm text-gray-700 mt-1">
                  Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Cooldown den: {item.cooldownUntil ? new Date(item.cooldownUntil).toLocaleString('vi-VN') : '-'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Người liên quan</h3>
                <p className="text-sm text-gray-700">
                  Seller:{' '}
                  {item.seller?.id ? (
                    <Link to={`/users/${item.seller.id}`} className="text-blue-600 hover:text-blue-700">
                      {item.seller.nickname || item.seller.id}
                    </Link>
                  ) : (
                    '-'
                  )}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Owner hien tai:{' '}
                  {item.currentOwner?.id ? (
                    <Link to={`/users/${item.currentOwner.id}`} className="text-blue-600 hover:text-blue-700">
                      {item.currentOwner.nickname || item.currentOwner.id}
                    </Link>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Thẻ</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Lịch sử giá</h3>
              {priceHistory.length === 0 ? (
                <p className="text-sm text-gray-600">Chưa có du lieu lich su gia.</p>
              ) : (
                <div className="space-y-2">
                  {priceHistory.map((point, index) => (
                    <div key={`${point.timestamp}-${index}`} className="border border-gray-200 rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900">{point.eventType || 'EVENT'}</p>
                        <p className="text-xs text-gray-600">
                          {point.timestamp ? new Date(point.timestamp).toLocaleString('vi-VN') : '-'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-700">
                        {new Intl.NumberFormat('vi-VN').format(Number(point.price || 0))} VND
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
