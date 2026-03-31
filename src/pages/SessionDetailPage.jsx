import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSession, getSessionAuctions } from '../api/sessions'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function SessionDetailPage() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load both session metadata and auction list in this session.
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sessionRes, auctionsRes] = await Promise.all([
        getSession(id),
        getSessionAuctions(id),
      ])
      setSession(readApiData(sessionRes))
      setAuctions(readApiData(auctionsRes) || [])
    } catch (err) {
      console.error('[SessionDetailPage] Failed to load session detail', err)
      setError(err?.response?.data?.message || 'Khong tai duoc chi tiet phien dau gia.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id, loadData])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VND'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chi tiet phien dau gia</h1>
          <Link to="/sessions" className="text-blue-600 hover:text-blue-700 font-medium">Ve danh sach phien</Link>
        </div>

        {loading && <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Dang tai du lieu...</div>}
        {!loading && error && <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>}

        {!loading && !error && session && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{session.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm text-gray-700">
                <p>Type: {session.type}</p>
                <p>Status: {session.status}</p>
                <p>Start: {session.startTime ? new Date(session.startTime).toLocaleString('vi-VN') : '-'}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Danh sach auction</h3>

              {auctions.length === 0 ? (
                <p className="text-gray-600">Phien nay chua co auction.</p>
              ) : (
                <div className="space-y-3">
                  {auctions.map((auction) => (
                    <div key={auction.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{auction.item?.name || 'Unnamed item'}</p>
                        <p className="text-sm text-gray-700 mt-1">Status: {auction.status}</p>
                        <p className="text-sm text-gray-700 mt-1">Current: {formatVnd(auction.currentPrice)}</p>
                      </div>
                      <Link to={`/auctions/${auction.id}`} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">
                        Vao phong dau gia
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
