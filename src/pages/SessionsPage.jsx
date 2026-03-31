import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions } from '../api/sessions'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load auction sessions list for current page.
  const loadSessions = useCallback(async (targetPage) => {
    setLoading(true)
    setError(null)
    try {
      const response = await listSessions({}, targetPage, 12)
      const payload = readApiData(response)
      setSessions(payload?.content || [])
      setMeta(payload?.meta || null)
    } catch (err) {
      console.error('[SessionsPage] Failed to load sessions', err)
      setError(err?.response?.data?.message || 'Khong tai duoc danh sach phien dau gia.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions(page)
  }, [loadSessions, page])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Danh sach phien dau gia</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Ve trang chu</Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Dang tai du lieu...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Chua co phien nao.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((session) => (
              <Link key={session.id} to={`/sessions/${session.id}`} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold text-gray-900">{session.title}</h2>
                <p className="text-sm text-gray-700 mt-2">Type: {session.type}</p>
                <p className="text-sm text-gray-700 mt-1">Status: {session.status}</p>
                <p className="text-sm text-gray-700 mt-1">
                  Start: {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN') : '-'}
                </p>
              </Link>
            ))}
          </div>
        )}

        {meta && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
              >
                Truoc
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))}
                disabled={meta.totalPages <= page + 1}
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
