import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  buyNow,
  cancelProxyBid,
  getAuction,
  getAuctionBids,
  getLiveChatMessages,
  placeBid,
  sendLiveChatMessage,
  setProxyBid,
  submitSealedBid,
} from '../api/auctions'
import { createStompClient } from '../lib/stomp'
import { useAuthStore } from '../store/authStore'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

const STATUS_META = {
  SCHEDULED: { label: 'Đã lên lịch', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  ACTIVE: { label: 'Đang diễn ra', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PAUSED: { label: 'Tạm dừng', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Đã kết thúc', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-700 border-rose-200' },
}

const WS_STATUS_META = {
  connected: { label: 'Đã kết nối', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  disconnected: { label: 'Ngắt kết nối', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  error: { label: 'Lỗi kết nối', className: 'bg-rose-100 text-rose-700 border-rose-200' },
}

const AUCTION_TYPE_LABEL = {
  ENGLISH: 'Đấu giá tăng dần',
  DUTCH: 'Đấu giá giảm dần',
  SEALED: 'Đấu giá kín',
}

export default function AuctionRoomPage() {
  const { id } = useParams()
  const { user } = useAuthStore()

  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsStatus, setWsStatus] = useState('disconnected')

  const [bidAmount, setBidAmount] = useState('')
  const [sealedAmount, setSealedAmount] = useState('')
  const [proxyMaxAmount, setProxyMaxAmount] = useState('')
  const [chatInput, setChatInput] = useState('')

  // Load auction detail for the room header and status panel.
  const loadAuction = useCallback(async () => {
    const response = await getAuction(id)
    setAuction(readApiData(response))
  }, [id])

  // Load recent bid history to display latest bidding activity.
  const loadBids = useCallback(async () => {
    const response = await getAuctionBids(id, 0, 20)
    const payload = readApiData(response)
    setBids(payload?.content || [])
  }, [id])

  // Load persisted live-chat history via REST API.
  const loadMessages = useCallback(async () => {
    const response = await getLiveChatMessages(id)
    setMessages(readApiData(response) || [])
  }, [id])

  // Load the whole room state in parallel.
  const loadAll = useCallback(async () => {
    await Promise.all([loadAuction(), loadBids(), loadMessages()])
  }, [loadAuction, loadBids, loadMessages])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        await loadAll()
      } catch (err) {
        console.error('[AuctionRoomPage] Failed to load room data', err)
        setError(err?.response?.data?.message || 'Không tải được phong dau gia.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      run()
    }
  }, [id, loadAll])

  useEffect(() => {
    if (!id) return undefined

    const client = createStompClient({
      onConnect: () => {
        setWsStatus('connected')

        client.subscribe(`/topic/auction/${id}`, () => {
          loadAuction().catch(() => {})
          loadBids().catch(() => {})
        })

        client.subscribe(`/topic/chat/${id}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body)
            setMessages((prev) => [
              ...prev,
              {
                id: payload.messageId || crypto.randomUUID(),
                sender: {
                  id: payload.senderId,
                  nickname: payload.senderNickname,
                  avatarUrl: payload.senderAvatarUrl,
                },
                content: payload.content,
                createdAt: payload.timestamp,
              },
            ])
          } catch (err) {
            console.error('[AuctionRoomPage] Failed to parse websocket chat payload', err)
            loadMessages().catch(() => {})
          }
        })
      },
      onWebSocketError: () => setWsStatus('error'),
      onStompError: () => setWsStatus('error'),
    })

    return () => {
      setWsStatus('disconnected')
      client.deactivate()
    }
  }, [id, loadAuction, loadBids, loadMessages])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VND'
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('vi-VN')
  }

  const getStatusMeta = (status) => STATUS_META[status] || { label: status || '-', className: 'bg-gray-100 text-gray-700 border-gray-200' }

  const wsMeta = WS_STATUS_META[wsStatus] || WS_STATUS_META.disconnected

  const auctionType = auction?.session?.type || auction?.type

  const auctionTypeLabel = AUCTION_TYPE_LABEL[auctionType] || (auctionType || 'Không xác định')

  // Wrapper to execute an auction action then refresh room data.
  const submitAction = async (action) => {
    setError(null)
    try {
      await action()
      await Promise.all([loadAuction(), loadBids()])
    } catch (err) {
      console.error('[AuctionRoomPage] Auction action failed', err)
      setError(err?.response?.data?.message || 'Thao tác thất bại.')
    }
  }

  // Submit a standard bid amount.
  const handlePlaceBid = (event) => {
    event.preventDefault()
    const amount = Number(bidAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    submitAction(async () => {
      await placeBid(id, { amount })
      setBidAmount('')
    })
  }

  // Submit sealed bid amount for sealed auctions.
  const handleSealedBid = (event) => {
    event.preventDefault()
    const amount = Number(sealedAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    submitAction(async () => {
      await submitSealedBid(id, { amount })
      setSealedAmount('')
    })
  }

  // Set proxy auto-bidding max amount.
  const handleSetProxy = (event) => {
    event.preventDefault()
    const maxAmount = Number(proxyMaxAmount)
    if (!Number.isFinite(maxAmount) || maxAmount <= 0) return
    submitAction(async () => {
      await setProxyBid(id, { maxAmount })
      setProxyMaxAmount('')
    })
  }

  // Send chat message to auction live chat.
  const handleSendChat = async (event) => {
    event.preventDefault()
    const content = chatInput.trim()
    if (!content) return

    try {
      await sendLiveChatMessage(id, { content })
      setChatInput('')
    } catch (err) {
      console.error('[AuctionRoomPage] Failed to send chat message', err)
      setError(err?.response?.data?.message || 'Gui tin nhan thất bại.')
    }
  }

  const canBuyNow = useMemo(() => auction?.status === 'ACTIVE', [auction])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Phòng đấu giá</h1>
              <p className="mt-1 text-slate-600">Theo dõi giá thời gian thực, đặt giá và trao đổi trực tiếp trong phiên.</p>
            </div>
            <Link to="/" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors font-medium">
              Về trang chủ
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-600">Đang tải dữ liệu...</div>
        ) : auction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusMeta(auction.status).className}`}>
                    {getStatusMeta(auction.status).label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full border border-indigo-200 text-indigo-700">
                    {auctionTypeLabel}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold text-slate-900">{auction.item?.name}</h2>
                <p className="text-slate-700 mt-2">{auction.item?.description || 'Không có mô tả.'}</p>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-slate-500">Giá hiện tại</p>
                    <p className="font-semibold text-emerald-700 mt-1">{formatVnd(auction.currentPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-slate-500">Giá khởi điểm</p>
                    <p className="font-semibold text-slate-800 mt-1">{formatVnd(auction.startPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-slate-500">Bước giá</p>
                    <p className="font-semibold text-slate-800 mt-1">{formatVnd(auction.stepPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:col-span-2">
                    <p className="text-slate-500">Thời điểm kết thúc</p>
                    <p className="font-semibold text-slate-800 mt-1">{formatDateTime(auction.endTime)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    { getStatusMeta(auction.status).label == "ENDED" ? <p className="text-slate-500">Người chiến thắng</p> : <p className="text-slate-500">Người thắng tạm thời</p>}
                    <p className="font-semibold text-slate-800 mt-1">{auction.winner?.nickname || '-'}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <form onSubmit={handlePlaceBid} className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold mb-2 text-slate-900">Đặt giá thường</h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        placeholder="Nhập số tiền"
                      />
                      <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Đặt giá</button>
                    </div>
                  </form>

                  <form onSubmit={handleSealedBid} className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold mb-2 text-slate-900">Đặt giá kín</h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sealedAmount}
                        onChange={(e) => setSealedAmount(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        placeholder="Nhập số tiền"
                      />
                      <button className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Gửi kín</button>
                    </div>
                  </form>

                  <form onSubmit={handleSetProxy} className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold mb-2 text-slate-900">Đặt giá ủy quyền</h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={proxyMaxAmount}
                        onChange={(e) => setProxyMaxAmount(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        placeholder="Mức tối đa"
                      />
                      <button className="px-3 py-2 rounded bg-violet-600 text-white hover:bg-violet-700">Thiết lập</button>
                    </div>
                  </form>

                  <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => submitAction(() => buyNow(id))}
                      disabled={!canBuyNow}
                      className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Mua ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => submitAction(() => cancelProxyBid(id))}
                      className="px-3 py-2 rounded bg-slate-600 text-white hover:bg-slate-700"
                    >
                      Hủy ủy quyền
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Kết nối thời gian thực</h3>
                  <span className={`inline-flex text-xs px-2 py-1 rounded-full border ${wsMeta.className}`}>{wsMeta.label}</span>
                  <p className="text-sm text-slate-600 mt-3">Hệ thống tự cập nhật lịch sử trả giá và trò chuyện ngay khi có thay đổi.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Mẹo theo loại phiên</h3>
                  {auctionType === 'ENGLISH' && <p className="text-sm text-slate-700">Giá tăng dần, hãy theo dõi bước giá và vào lệnh sớm trước khi cạnh tranh cao.</p>}
                  {auctionType === 'DUTCH' && <p className="text-sm text-slate-700">Giá giảm dần theo thời gian, cân nhắc điểm rơi phù hợp để mua ngay.</p>}
                  {auctionType === 'SEALED' && <p className="text-sm text-slate-700">Giá đặt kín chỉ gửi một lần, nên đặt mức tối ưu theo ngân sách và độ hiếm vật phẩm.</p>}
                  {!['ENGLISH', 'DUTCH', 'SEALED'].includes(auctionType || '') && <p className="text-sm text-slate-700">Theo dõi thông báo hệ thống để nắm quy tắc phiên đấu giá hiện tại.</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Lịch sử trả giá</h3>
                {bids.length === 0 ? (
                  <p className="text-slate-600">Chưa có lượt trả giá nào.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {bids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-slate-900">{bid.bidder?.nickname || 'Ẩn danh'} {bid.proxy ? '(ủy quyền)' : ''}</p>
                        <p className="text-sm font-semibold text-emerald-700">{formatVnd(bid.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Trò chuyện trực tiếp</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto mb-4 pr-1">
                  {messages.length === 0 ? (
                    <p className="text-slate-600">Chưa có tin nhắn.</p>
                  ) : (
                    messages.map((msg) => {
                      const mine = user?.id && msg.sender?.id === user.id
                      return (
                        <div key={msg.id} className={`p-3 rounded-lg ${mine ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <p className="text-sm font-medium text-slate-900">{msg.sender?.nickname || 'Ẩn danh'}</p>
                          <p className="text-sm text-slate-700 mt-1">{msg.content}</p>
                        </div>
                      )
                    })
                  )}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Gửi</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

