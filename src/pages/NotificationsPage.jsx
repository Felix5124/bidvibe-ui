import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../api/notifications'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [meta, setMeta] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load notification list and unread badge count.
  const loadData = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, countRes] = await Promise.all([
        getNotifications(targetPage, 15),
        getUnreadCount(),
      ])
      const payload = readApiData(listRes)
      setNotifications(payload?.content || [])
      setMeta(payload?.meta || null)
      setUnreadCount(Number(readApiData(countRes) || 0))
    } catch (err) {
      console.error('[NotificationsPage] Failed to load notifications', err)
      setError(err?.response?.data?.message || 'Không tải được thông báo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page)
  }, [loadData, page])

  // Mark a single notification as read.
  const handleMarkOne = async (id) => {
    try {
      await markAsRead(id)
      await loadData(page)
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark notification as read', err)
      setError(err?.response?.data?.message || 'Đánh dấu da doc thất bại.')
    }
  }

  // Mark all notifications as read.
  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      await loadData(page)
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark all notifications as read', err)
      setError(err?.response?.data?.message || 'Đánh dấu tat ca da doc thất bại.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Trung tâm thông báo</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Về trang chủ</Link>
        </div>

        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-gray-700">Chưa đọc: <span className="font-semibold">{unreadCount}</span></p>
          <button type="button" onClick={handleMarkAll} className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Đánh dấu tất cả đã đọc</button>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Không có thông báo.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((noti) => (
              <div key={noti.id} className={`bg-white border rounded-xl p-4 ${noti.read ? 'border-gray-200' : 'border-blue-300'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{noti.title}</p>
                    <p className="text-sm text-gray-700 mt-1">{noti.content}</p>
                    <p className="text-xs text-gray-500 mt-2">{noti.createdAt ? new Date(noti.createdAt).toLocaleString('vi-VN') : '-'}</p>
                  </div>
                  {!noti.read && (
                    <button type="button" onClick={() => handleMarkOne(noti.id)} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">
                      Da doc
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {meta && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60">Trước</button>
              <button type="button" onClick={() => setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))} disabled={meta.totalPages <= page + 1} className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

