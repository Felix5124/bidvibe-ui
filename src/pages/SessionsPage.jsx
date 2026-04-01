import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions } from '../api/sessions'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

const STATUS_META = {
  SCHEDULED: { label: 'Đã lên lịch', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  ACTIVE: { label: 'Đang diễn ra', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PAUSED: { label: 'Tạm dừng', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Đã kết thúc', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-700 border-rose-200' },
}

const TYPE_LABEL = {
  ENGLISH: 'Đấu giá tăng dần',
  DUTCH: 'Đấu giá giảm dần',
  SEALED: 'Đấu giá kín',
}

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48]

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSessions = useCallback(async (targetPage, targetSize) => {
    setLoading(true)
    setError(null)
    try {
      const response = await listSessions({}, targetPage, targetSize)
      const payload = readApiData(response)
      setSessions(payload?.content || [])
      setMeta(payload?.meta || null)
    } catch (err) {
      console.error('[SessionsPage] Failed to load sessions', err)
      setError(err?.response?.data?.message || 'Không tải được danh sach phien dau gia.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions(page, size)
  }, [loadSessions, page, size])

  const handleSizeChange = (newSize) => {
    setSize(newSize)
    setPage(0)
  }

  const getStatusMeta = (status) => STATUS_META[status] || { label: status || '-', className: 'bg-gray-100 text-gray-700 border-gray-200' }

  const getTypeLabel = (type) => TYPE_LABEL[type] || (type || '-')

  const formatDateTime = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('vi-VN')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-6 md:p-8 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Danh sách phiên đấu giá</h1>
              <p className="mt-2 text-slate-200">Theo dõi lịch mở phiên và truy cập nhanh vào các phòng đấu giá đang hoạt động.</p>
            </div>
            <Link to="/" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/15 border border-white/25 hover:bg-white/25 transition-colors font-medium">
              Về trang chủ
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-600">Đang tải dữ liệu...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-600">Chưa có phiên nào.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Link
                key={session.id}
                to={`/sessions/${session.id}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="text-xs px-2 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-100">
                    {getTypeLabel(session.type)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusMeta(session.status).className}`}>
                    {getStatusMeta(session.status).label}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{session.title}</h2>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Bắt đầu: <span className="font-medium text-slate-800">{formatDateTime(session.startTime)}</span></p>
                </div>

                <p className="mt-4 text-sm font-medium text-indigo-700">Xem chi tiết phiên →</p>
              </Link>
            ))}
          </div>
        )}

        {meta && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <div className="flex gap-1">
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSizeChange(option)}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      size === option
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">/ trang</span>
            </div>
            
            <p className="text-sm text-gray-600">
              Trang {page + 1} / {Math.max(meta.totalPages || 1, 1)} — {meta.totalElements || 0} phiên
            </p>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Trước
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                {page + 1} / {Math.max(meta.totalPages || 1, 1)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min((meta.totalPages || 1) - 1, p + 1))}
                disabled={page >= (meta.totalPages || 1) - 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

