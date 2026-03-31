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
        setError(err?.response?.data?.message || 'Khong tai duoc phong dau gia.')
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

  // Wrapper to execute an auction action then refresh room data.
  const submitAction = async (action) => {
    setError(null)
    try {
      await action()
      await Promise.all([loadAuction(), loadBids()])
    } catch (err) {
      console.error('[AuctionRoomPage] Auction action failed', err)
      setError(err?.response?.data?.message || 'Thao tac that bai.')
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
      setError(err?.response?.data?.message || 'Gui tin nhan that bai.')
    }
  }

  const canBuyNow = useMemo(() => auction?.status === 'ACTIVE', [auction])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Phong dau gia</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Ve trang chu</Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Dang tai du lieu...</div>
        ) : auction && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900">{auction.item?.name}</h2>
              <p className="text-gray-700 mt-2">{auction.item?.description || 'Khong co mo ta.'}</p>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <p>Status: <span className="font-medium">{auction.status}</span></p>
                <p>Current: <span className="font-medium text-emerald-700">{formatVnd(auction.currentPrice)}</span></p>
                <p>Start: <span className="font-medium">{formatVnd(auction.startPrice)}</span></p>
                <p>Step: <span className="font-medium">{formatVnd(auction.stepPrice)}</span></p>
                <p>Ket thuc: <span className="font-medium">{auction.endTime ? new Date(auction.endTime).toLocaleString('vi-VN') : '-'}</span></p>
                <p>Winner: <span className="font-medium">{auction.winner?.nickname || '-'}</span></p>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <form onSubmit={handlePlaceBid} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Dat gia thuong</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      placeholder="So tien"
                    />
                    <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Dat</button>
                  </div>
                </form>

                <form onSubmit={handleSealedBid} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Dat gia kin</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sealedAmount}
                      onChange={(e) => setSealedAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      placeholder="So tien"
                    />
                    <button className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Gui</button>
                  </div>
                </form>

                <form onSubmit={handleSetProxy} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Proxy bid</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proxyMaxAmount}
                      onChange={(e) => setProxyMaxAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      placeholder="Muc toi da"
                    />
                    <button className="px-3 py-2 rounded bg-violet-600 text-white hover:bg-violet-700">Set</button>
                  </div>
                </form>

                <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-2">
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
                    className="px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Huy proxy
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Realtime</h3>
              <p className="text-sm text-gray-700">WebSocket: {wsStatus}</p>
              <p className="text-xs text-gray-500 mt-2">Dang subscribe gia realtime va chat topic cua auction.</p>
            </div>

            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lich su bid</h3>
              {bids.length === 0 ? (
                <p className="text-gray-600">Chua co luot bid nao.</p>
              ) : (
                <div className="space-y-2">
                  {bids.map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-900">{bid.bidder?.nickname || 'Unknown'} {bid.proxy ? '(proxy)' : ''}</p>
                      <p className="text-sm font-semibold text-emerald-700">{formatVnd(bid.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Live chat</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-gray-600">Chua co tin nhan.</p>
                ) : (
                  messages.map((msg) => {
                    const mine = user?.id && msg.sender?.id === user.id
                    return (
                      <div key={msg.id} className={`p-3 rounded-lg ${mine ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-900">{msg.sender?.nickname || 'Unknown'}</p>
                        <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
                      </div>
                    )
                  })
                )}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhap tin nhan..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Gui</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
