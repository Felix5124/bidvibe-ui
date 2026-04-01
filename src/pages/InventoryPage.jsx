import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { confirmReceipt, getInventory } from '../api/items'
import { createListing } from '../api/market'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [size] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marketPriceById, setMarketPriceById] = useState({})
  const [processingId, setProcessingId] = useState(null)

  // Load inventory list for current user.
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
      setError(err?.response?.data?.message || 'Không tải được kho do.')
    } finally {
      setLoading(false)
    }
  }, [size])

  useEffect(() => {
    loadInventory(page)
  }, [loadInventory, page])

  // Confirm item receipt after delivery.
  const handleConfirmReceipt = async (itemId) => {
    setProcessingId(itemId)
    try {
      await confirmReceipt(itemId)
      await loadInventory(page)
    } catch (err) {
      console.error('[InventoryPage] Failed to confirm receipt', err)
      setError(err?.response?.data?.message || 'Xac nhan nhan hang thất bại.')
    } finally {
      setProcessingId(null)
    }
  }

  // List a selected inventory item on market with asking price.
  const handleListOnMarket = async (itemId) => {
    const askingPrice = Number(marketPriceById[itemId])
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      setError('Gia niem yet phai lon hon 0.')
      return
    }

    setProcessingId(itemId)
    try {
      await createListing({ itemId, askingPrice })
      setMarketPriceById((prev) => ({ ...prev, [itemId]: '' }))
      await loadInventory(page)
    } catch (err) {
      console.error('[InventoryPage] Failed to list item on market', err)
      setError(err?.response?.data?.message || 'Niem yet len cho thất bại.')
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kho đồ của tôi</h1>
            <p className="text-gray-600 mt-1">Quản lý vật phẩm, xác nhận hàng và niêm yết lên chợ.</p>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">Kho đồ trống.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const isProcessing = processingId === item.id
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{item.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{item.description || 'Không có mo ta.'}</p>
                  <div className="mt-3 text-sm text-gray-700">Rarity: {item.rarity || '-'}</div>

                  <div className="mt-4 flex gap-3">
                    <Link
                      to={`/items/${item.id}`}
                      className="inline-flex items-center justify-center px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      Xem chi tiet
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleConfirmReceipt(item.id)}
                      disabled={isProcessing}
                      className="px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Xac nhan nhan hang
                    </button>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <label className="text-sm text-gray-700 block mb-2">Gia niem yet (VND)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={marketPriceById[item.id] || ''}
                        onChange={(e) => setMarketPrice(item.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập gia"
                      />
                      <button
                        type="button"
                        onClick={() => handleListOnMarket(item.id)}
                        disabled={isProcessing}
                        className="px-3 py-2 rounded bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-60"
                      >
                        Ban
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {meta && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)} - {meta.totalElements} vật phẩm
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))}
                disabled={loading || meta.totalPages <= page + 1}
                className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
