import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions } from '../api/sessions'
import { SessionsListSkeleton } from '../components/Skeleton'
import PageHeaderFrame from '../components/PageHeaderFrame'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

const STATUS_META = {
  SCHEDULED: { label: 'Đã lên lịch', className: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  ACTIVE: { label: 'Đang diễn ra', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PAUSED: { label: 'Tạm dừng', className: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
}

const TYPE_META = {
  ENGLISH: { label: 'Tăng dần', icon: '📈', color: 'text-green-600' },
  DUTCH: { label: 'Giảm dần', icon: '📉', color: 'text-red-600' },
  SEALED: { label: 'Kín', icon: '🔒', color: 'text-purple-600' },
}

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48]

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(12)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusCounts, setStatusCounts] = useState({
    SCHEDULED: 0,
    ACTIVE: 0,
    PAUSED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  })

  const loadSessions = useCallback(async (targetPage, targetSize, status, type) => {
    setLoading(true)
    setError(null)
    try {
      const filters = {}
      if (status) filters.status = status
      if (type) filters.type = type
      
      const response = await listSessions(filters, targetPage, targetSize)
      const payload = readApiData(response)
      setSessions(payload?.content || [])
      setMeta(payload?.meta || null)
    } catch (err) {
      console.error('[SessionsPage] Failed to load sessions', err)
      setError(err?.response?.data?.message || 'Không tải được danh sách phiên đấu giá.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStatusCounts = useCallback(async () => {
    const statuses = ['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']
    const counts = {}
    
    await Promise.all(
      statuses.map(async (status) => {
        try {
          const response = await listSessions({ status }, 0, 1)
          const payload = readApiData(response)
          counts[status] = payload?.meta?.totalElements || 0
        } catch {
          counts[status] = 0
        }
      })
    )
    
    setStatusCounts(counts)
  }, [])

  useEffect(() => {
    loadSessions(page, size, statusFilter, typeFilter)
  }, [loadSessions, page, size, statusFilter, typeFilter])

  useEffect(() => {
    loadStatusCounts()
  }, [loadStatusCounts])

  const handleSizeChange = (newSize) => {
    setSize(newSize)
    setPage(0)
  }

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus)
    setPage(0)
  }

  const handleTypeChange = (newType) => {
    setTypeFilter(newType)
    setPage(0)
  }

  const getStatusMeta = (status) => STATUS_META[status] || { label: status || '-', className: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' }
  const getTypeMeta = (type) => TYPE_META[type] || { label: type || '-', icon: '📦', color: 'text-gray-600' }

  const formatDateTime = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('vi-VN')
  }

  const statusOptions = [
    { key: '', label: 'Tất cả', className: 'bg-gray-100 text-gray-700 border-gray-300' },
    { key: 'SCHEDULED', label: 'Đã lên lịch', className: 'bg-blue-50 text-blue-700 border-blue-300' },
    { key: 'ACTIVE', label: 'Đang diễn ra', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    { key: 'PAUSED', label: 'Tạm dừng', className: 'bg-amber-50 text-amber-700 border-amber-300' },
    { key: 'COMPLETED', label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-600 border-gray-300' },
    { key: 'CANCELLED', label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-300' },
  ]

  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Danh sách phiên đấu giá"
          description="Theo dõi lịch mở phiên và truy cập nhanh vào các phòng đấu giá đang hoạt động."
        />

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const count = status.key === '' ? totalCount : (statusCounts[status.key] || 0)
                const showCount = status.key !== 'COMPLETED' && status.key !== 'CANCELLED'
                return (
                  <button
                    key={status.key}
                    onClick={() => handleStatusChange(status.key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                      statusFilter === status.key
                        ? `${status.className} ring-2 ring-offset-1 ring-blue-300`
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status.label}
                    {showCount && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${statusFilter === status.key ? 'bg-white/50' : 'bg-gray-100'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Loại phiên:</label>
              <select
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả loại</option>
                <option value="ENGLISH">📈 Tăng dần (English)</option>
                <option value="DUTCH">📉 Giảm dần (Dutch)</option>
                <option value="SEALED">🔒 Kín (Sealed Bid)</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <SessionsListSkeleton count={size} />
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-2">Không có phiên nào phù hợp với bộ lọc.</p>
            <button
              onClick={() => { setStatusFilter(''); setTypeFilter(''); }}
              className="text-indigo-600 hover:underline text-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => {
              const status = getStatusMeta(session.status)
              const type = getTypeMeta(session.type)
              const isActive = session.status === 'ACTIVE'
              
              return (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className={`group bg-white border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${
                    isActive ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  {/* Status & Type Badges */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${type.color}`}>{type.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${status.className}`}>
                      {isActive && <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5 animate-pulse`} />}
                      {status.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2">
                    {session.title}
                  </h2>

                  {/* Time Info */}
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Bắt đầu: <span className="font-medium text-slate-800">{formatDateTime(session.startTime)}</span></span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-700 group-hover:text-indigo-600">
                      Xem chi tiết →
                    </span>
                    {isActive && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        Tham gia ngay
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
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
                    disabled={loading}
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