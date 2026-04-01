import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist, toggleWatchlist } from '../api/users'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function WatchlistPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [manualItemId, setManualItemId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load paginated watchlist items.
  const loadData = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getWatchlist(targetPage, 12)
      const payload = readApiData(response)
      setItems(payload?.content || [])
      setMeta(payload?.meta || null)
    } catch (err) {
      console.error('[WatchlistPage] Failed to load watchlist', err)
      setError(err?.response?.data?.message || 'Không tải được watchlist.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page)
  }, [loadData, page])

  // Remove one item from watchlist.
  const handleRemove = async (itemId) => {
    try {
      await removeFromWatchlist(itemId)
      await loadData(page)
    } catch (err) {
      console.error('[WatchlistPage] Failed to remove watchlist item', err)
      setError(err?.response?.data?.message || 'Xoa khoi watchlist thất bại.')
    }
  }

  // Toggle watchlist status by entering item id manually.
  const handleAddById = async (event) => {
    event.preventDefault()
    if (!manualItemId.trim()) return
    try {
      await toggleWatchlist(manualItemId.trim())
      setManualItemId('')
      await loadData(0)
      setPage(0)
    } catch (err) {
      console.error('[WatchlistPage] Failed to toggle watchlist item', err)
      setError(err?.response?.data?.message || 'Them vao watchlist thất bại.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách theo dõi</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Về trang chủ</Link>
        </div>

        <form onSubmit={handleAddById} className="mb-5 bg-white border border-gray-200 rounded-xl p-4 flex gap-2">
          <input
            value={manualItemId}
            onChange={(e) => setManualItemId(e.target.value)}
            placeholder="Nhập itemId de them watchlist"
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
          />
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Them</button>
        </form>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Watchlist trong.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                <p className="text-sm text-gray-700 mt-2">{item.description || 'Không có mo ta.'}</p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/items/${item.id}`} className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Chi tiết</Link>
                  <button type="button" onClick={() => handleRemove(item.id)} className="px-3 py-2 rounded bg-gray-600 text-white text-sm hover:bg-gray-700">Bỏ theo dõi</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60">Truoc</button>
              <button type="button" onClick={() => setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))} disabled={meta.totalPages <= page + 1} className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

