import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { confirmReceipt, getInventory } from '../api/items'
import { createListing } from '../api/market'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

// Map trạng thái để hiển thị tiếng Việt và màu sắc thân thiện
const STATUS_MAP = {
  PENDING: { label: 'Đang chờ duyệt', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  IN_AUCTION: { label: 'Đang đấu giá', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  IN_INVENTORY: { label: 'Sẵn sàng trong kho', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  SHIPPED: { label: 'Đã nhận hàng', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  REJECTED: { label: 'Bị từ chối', color: 'bg-red-100 text-red-800 border-red-200' }
}

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [size] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marketPriceById, setMarketPriceById] = useState({})
  const [processingId, setProcessingId] = useState(null)

  const loadInventory = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getInventory(targetPage, size)
      const payload = readApiData(response)
      setItems(payload?.content || [])
      setMeta(payload?.meta || null)
    } catch (err) {
      console.error('[InventoryPage] Failed to load inventory', err)
      setError(err?.response?.data?.message || 'Không tải được kho đồ.')
    } finally {
      setLoading(false)
    }
  }, [size])

  useEffect(() => {
    loadInventory(page)
  }, [loadInventory, page])

  const handleConfirmReceipt = async (itemId) => {
    setProcessingId(itemId)
    try {
      await confirmReceipt(itemId)
      await loadInventory(page)
    } catch (err) {
      console.error('[InventoryPage] Failed to confirm receipt', err)
      setError(err?.response?.data?.message || 'Xác nhận nhận hàng thất bại.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleListOnMarket = async (itemId) => {
    const askingPrice = Number(marketPriceById[itemId])
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      setError('Giá niêm yết phải lớn hơn 0.')
      return
    }

    setProcessingId(itemId)
    try {
      await createListing({ itemId, askingPrice })
      setMarketPriceById((prev) => ({ ...prev, [itemId]: '' }))
      await loadInventory(page)
    } catch (err) {
      console.error('[InventoryPage] Failed to list item on market', err)
      setError(err?.response?.data?.message || 'Niêm yết lên chợ thất bại.')
    } finally {
      setProcessingId(null)
    }
  }

  const setMarketPrice = (itemId, value) => {
    setMarketPriceById((prev) => ({ ...prev, [itemId]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý vật phẩm</h1>
            <p className="text-gray-600 mt-1">Theo dõi đồ bạn ký gửi, đồ đã mua và niêm yết lên chợ đen.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/items/submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition shadow-sm">
              + Ký gửi đồ mới
            </Link>
            <Link to="/" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition shadow-sm">
              Trang chủ
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            Bạn chưa có vật phẩm nào trong kho hoặc đang ký gửi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const isProcessing = processingId === item.id
              const statusInfo = STATUS_MAP[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-800' }
              const isReadyInInventory = item.status === 'IN_INVENTORY'

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{item.name}</h2>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <img src={item.imageUrls[0]} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-4 border border-gray-100" />
                  )}
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {item.description || 'Không có mô tả.'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">Độ hiếm: {item.rarity || '-'}</span>
                    {item.cooldownUntil && new Date(item.cooldownUntil) > new Date() && (
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md">
                        Khóa đến: {new Date(item.cooldownUntil).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {/* NÚT ACTIONS CHUNG */}
                  <div className="flex gap-2 w-full mt-auto">
                    <Link
                      to={`/items/${item.id}`}
                      className="flex-1 text-center py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
                    >
                      Chi tiết
                    </Link>
                    {isReadyInInventory && (
                      <button
                        type="button"
                        onClick={() => handleConfirmReceipt(item.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
                      >
                        Đã nhận hàng
                      </button>
                    )}
                  </div>

                  {/* FORM BÁN CHỢ ĐEN (Chỉ hiện khi item đã vào kho) */}
                  {isReadyInInventory && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="text-xs font-semibold text-gray-700 block mb-2 uppercase tracking-wide">Đăng bán lên Chợ Đen</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={marketPriceById[item.id] || ''}
                          onChange={(e) => setMarketPrice(item.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Giá bán (VND)"
                        />
                        <button
                          type="button"
                          onClick={() => handleListOnMarket(item.id)}
                          disabled={isProcessing || !marketPriceById[item.id]}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          Bán
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
            <p className="text-sm text-gray-600 font-medium">
              Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)} — Tổng số {meta.totalElements} vật phẩm
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition"
              >
                Trang trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))}
                disabled={loading || meta.totalPages <= page + 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}