import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buyListing, cancelListing, getListingDetail, getListingMessages, sendListingMessage } from '../api/market'
import { createStompClient } from '../lib/stomp'
import { useAuthStore } from '../store/authStore'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function MarketDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [listing, setListing] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsStatus, setWsStatus] = useState('disconnected')

  const isSeller = useMemo(() => user?.id && listing?.seller?.id && user.id === listing.seller.id, [listing, user])
  const canChat = useMemo(() => listing?.buyer?.id || isSeller, [isSeller, listing])

  // Load listing detail card info.
  const loadDetail = useCallback(async () => {
    const response = await getListingDetail(listingId)
    setListing(readApiData(response))
  }, [listingId])

  // Load listing negotiation message history.
  const loadMessages = useCallback(async () => {
    const response = await getListingMessages(listingId)
    setMessages(readApiData(response) || [])
  }, [listingId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([loadDetail(), loadMessages()])
      } catch (err) {
        console.error('[MarketDetailPage] Failed to load listing detail/messages', err)
        setError(err?.response?.data?.message || 'Không tải được chi tiet listing.')
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      load()
    }
  }, [listingId, loadDetail, loadMessages])

  useEffect(() => {
    if (!listingId) return undefined

    const client = createStompClient({
      onConnect: () => {
        setWsStatus('connected')
        client.subscribe(`/topic/chat/p2p/${user?.id || 'anonymous'}`, () => {
          loadMessages().catch(() => {})
        })
      },
      onWebSocketError: () => setWsStatus('error'),
      onStompError: () => setWsStatus('error'),
    })

    return () => {
      setWsStatus('disconnected')
      client.deactivate()
    }
  }, [listingId, loadMessages, user?.id])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VND'
  }

  // Buy current listing at asking price.
  const handleBuy = async () => {
    try {
      await buyListing(listingId)
      await loadDetail()
    } catch (err) {
      console.error('[MarketDetailPage] Failed to buy listing', err)
      setError(err?.response?.data?.message || 'Mua listing thất bại.')
    }
  }

  // Cancel listing if current user is seller.
  const handleCancelListing = async () => {
    try {
      await cancelListing(listingId)
      navigate('/market')
    } catch (err) {
      console.error('[MarketDetailPage] Failed to cancel listing', err)
      setError(err?.response?.data?.message || 'Huy listing thất bại.')
    }
  }

  // Send a message in listing negotiation thread.
  const handleSend = async (event) => {
    event.preventDefault()
    const content = chatInput.trim()
    if (!content) return

    try {
      await sendListingMessage(listingId, { content })
      setChatInput('')
      await loadMessages()
    } catch (err) {
      console.error('[MarketDetailPage] Failed to send listing message', err)
      setError(err?.response?.data?.message || 'Gui tin nhan thất bại.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết tin đăng</h1>
          <Link to="/market" className="text-blue-600 hover:text-blue-700 font-medium">Ve cho den</Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>
        ) : listing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <p>Rarity: {listing.item?.rarity || '-'}</p>
                <p>Gia niem yet: <span className="font-semibold text-emerald-700">{formatVnd(listing.askingPrice)}</span></p>
                <p>Buyer: {listing.buyer?.nickname || '-'}</p>
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
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trạng thái kết nối</h3>
              <p className="text-sm text-gray-700">WebSocket: {wsStatus}</p>
              <p className="text-xs text-gray-500 mt-2">
                Tin nhan listing hien tai duoc dong bo qua API; socket duoc bat de san sang cho realtime.
              </p>
            </div>

            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Thương lượng</h3>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-gray-600">Chưa có tin nhan.</p>
                ) : (
                  messages.map((msg) => {
                    const mine = user?.id && msg.sender?.id === user.id
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${mine ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
                      >
                        <p className="text-sm font-medium text-gray-900">{msg.sender?.nickname || 'Unknown'}</p>
                        <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString('vi-VN') : ''}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={canChat ? 'Nhập noi dung...' : 'Chi seller/buyer moi duoc chat.'}
                  disabled={!canChat}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  disabled={!canChat}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Gui
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

