import { useAuthStore } from '../../store/authStore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getOverview,
  getRevenue,
  getAuctionStats,
  getMarketStats,
} from '../../api/adminAnalytics'
import {
  listUsers,
  getUserDetail,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  changeUserRole,
  kickUserFromAuction,
} from '../../api/adminUsers'
import {
  listItems,
  getItemDetail,
  approveItem,
  rejectItem,
} from '../../api/adminItems'
import {
  listTransactions,
  getPendingTransactions,
  approveDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
  processTransaction,
  approveTransaction,
  rejectTransaction,
} from '../../api/adminTransactions'
import {
  listSessions,
  createSession,
  getSessionDetail,
  getSessionAuctions,
  addItemToSession,
  removeAuctionFromSession,
  activateSession,
  pauseSession,
  resumeSession,
  stopSession,
  resetAuctionTimer,
  removeAuctionBid,
} from '../../api/adminSessions'
import { getListingMessagesForAdmin } from '../../api/adminMarket'
import { getAuctionBids } from '../../api/auctions'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

const toOptionalNumber = (value) => {
  if (value == null || String(value).trim() === '') return null
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/\./g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState('users')

  const [overview, setOverview] = useState(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [overviewError, setOverviewError] = useState(null)

  const [analyticsRange, setAnalyticsRange] = useState(() => {
    const to = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    return { from, to }
  })
  const [revenue, setRevenue] = useState(null)
  const [auctionStats, setAuctionStats] = useState(null)
  const [marketStats, setMarketStats] = useState(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [sessions, setSessions] = useState([])
  const [adminError, setAdminError] = useState(null)
  const [isLoadingTabData, setIsLoadingTabData] = useState(false)

  const [rejectReasonByItem, setRejectReasonByItem] = useState({})
  const [kickAuctionByUser, setKickAuctionByUser] = useState({})
  const [selectedUserDetail, setSelectedUserDetail] = useState(null)
  const [selectedItemDetail, setSelectedItemDetail] = useState(null)

  const [sessionForm, setSessionForm] = useState({ title: '', type: 'ENGLISH', startTime: '' })
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null)
  const [selectedSessionAuctions, setSelectedSessionAuctions] = useState([])
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [approvedItems, setApprovedItems] = useState([])
  const [isLoadingApprovedItems, setIsLoadingApprovedItems] = useState(false)
  const [approvedItemsKeyword, setApprovedItemsKeyword] = useState('')
  const [auctionBidsByAuction, setAuctionBidsByAuction] = useState({})
  const [addAuctionForm, setAddAuctionForm] = useState({
    itemId: '',
    startPrice: '',
    stepPrice: '',
    minPrice: '',
    endTime: '',
  })

  const [listingIdForMessages, setListingIdForMessages] = useState('')
  const [listingMessages, setListingMessages] = useState([])
  const [isLoadingListingMessages, setIsLoadingListingMessages] = useState(false)

  const loadOverview = useCallback(async () => {
    setIsLoadingOverview(true)
    setOverviewError(null)

    try {
      const response = await getOverview()
      setOverview(readApiData(response))
    } catch (error) {
      console.error('[AdminDashboard] Failed to load admin overview', error)
      setOverviewError(error?.response?.data?.message || 'Không tải được so lieu tong quan.')
    } finally {
      setIsLoadingOverview(false)
    }
  }, [])

  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true)
    try {
      const [revenueRes, auctionRes, marketRes] = await Promise.all([
        getRevenue({ from: analyticsRange.from, to: analyticsRange.to }),
        getAuctionStats(),
        getMarketStats(),
      ])

      setRevenue(readApiData(revenueRes))
      setAuctionStats(readApiData(auctionRes))
      setMarketStats(readApiData(marketRes))
    } catch (error) {
      console.error('[AdminDashboard] Failed to load deep analytics', error)
      setAdminError(error?.response?.data?.message || 'Không tải được analytics chi tiet.')
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [analyticsRange.from, analyticsRange.to])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const loadUsers = async () => {
    const response = await listUsers({}, 0, 20)
    setUsers(readApiData(response)?.content || [])
  }

  const loadItems = async () => {
    const response = await listItems({ status: 'PENDING' }, 0, 20)
    setItems(readApiData(response)?.content || [])
  }

  const loadTransactions = async () => {
    const [pagedRes, pendingRes] = await Promise.all([
      listTransactions({ status: 'PENDING' }, 0, 20),
      getPendingTransactions(),
    ])

    setTransactions(readApiData(pagedRes)?.content || [])
    setPendingTransactions(readApiData(pendingRes) || [])
  }

  const loadSessions = async () => {
    const response = await listSessions({}, 0, 20)
    setSessions(readApiData(response)?.content || [])
  }

  const loadApprovedItems = useCallback(async () => {
    setIsLoadingApprovedItems(true)
    try {
      const response = await listItems({ status: 'APPROVED' }, 0, 100)
      setApprovedItems(readApiData(response)?.content || [])
    } catch (error) {
      console.error('[AdminDashboard] Failed to load approved items for session modal', error)
      setAdminError(error?.response?.data?.message || 'Không tải được danh sách vật phẩm đã duyệt.')
    } finally {
      setIsLoadingApprovedItems(false)
    }
  }, [])

  const loadTabData = useCallback(async () => {
    setIsLoadingTabData(true)
    setAdminError(null)

    try {
      if (tab === 'users') await loadUsers()
      if (tab === 'items') await loadItems()
      if (tab === 'transactions') await loadTransactions()
      if (tab === 'sessions') await loadSessions()
    } catch (error) {
      console.error('[AdminDashboard] Failed to load admin tab data', { tab, error })
      setAdminError(error?.response?.data?.message || 'Không tải được du lieu admin.')
    } finally {
      setIsLoadingTabData(false)
    }
  }, [tab])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VND'
  }

  const runAdminAction = async (fn, options = {}) => {
    const { reloadTab = true, reloadOverview = true } = options
    setAdminError(null)

    try {
      await fn()
      if (reloadTab) {
        await loadTabData()
      }
      if (reloadOverview) {
        await loadOverview()
      }
    } catch (error) {
      const statusCode = error?.response?.status
      if (statusCode === 409) {
        console.warn('[AdminDashboard] Admin action conflict', error?.response?.data)
        setAdminError(error?.response?.data?.message || 'Trạng thái hiện tại không cho phép thao tac nay.')
        return
      }

      console.error('[AdminDashboard] Admin action failed', error)
      setAdminError(error?.response?.data?.message || 'Thao tác admin thất bại.')
    }
  }

  const handleLoadUserDetail = async (userId) => {
    setAdminError(null)
    try {
      const response = await getUserDetail(userId)
      setSelectedUserDetail(readApiData(response))
    } catch (error) {
      console.error('[AdminDashboard] Failed to load user detail', error)
      setAdminError(error?.response?.data?.message || 'Không tải được chi tiet user.')
    }
  }

  const handleKickUser = async (userId) => {
    const auctionId = kickAuctionByUser[userId]?.trim()
    if (!auctionId) {
      setAdminError('Nhập auctionId truoc khi kick user.')
      return
    }

    await runAdminAction(() => kickUserFromAuction(userId, auctionId), {
      reloadTab: false,
      reloadOverview: false,
    })
  }

  const handleLoadItemDetail = async (itemId) => {
    setAdminError(null)
    try {
      const response = await getItemDetail(itemId)
      setSelectedItemDetail(readApiData(response))
    } catch (error) {
      console.error('[AdminDashboard] Failed to load item detail', error)
      setAdminError(error?.response?.data?.message || 'Không tải được chi tiet item.')
    }
  }

  const loadSessionManagement = useCallback(async (sessionId) => {
    setIsSessionModalOpen(true)
    setSelectedSessionId(sessionId)
    setIsLoadingSessionDetail(true)

    try {
      const [detailRes, auctionsRes] = await Promise.all([
        getSessionDetail(sessionId),
        getSessionAuctions(sessionId),
        loadApprovedItems(),
      ])
      setSelectedSessionDetail(readApiData(detailRes))
      setSelectedSessionAuctions(readApiData(auctionsRes) || [])
      setAuctionBidsByAuction({})
    } catch (error) {
      console.error('[AdminDashboard] Failed to load session management data', error)
      setAdminError(error?.response?.data?.message || 'Không tải được du lieu session.')
    } finally {
      setIsLoadingSessionDetail(false)
    }
  }, [loadApprovedItems])

  const closeSessionManagementModal = () => {
    setIsSessionModalOpen(false)
    setSelectedSessionId(null)
    setSelectedSessionDetail(null)
    setSelectedSessionAuctions([])
    setAuctionBidsByAuction({})
    setApprovedItemsKeyword('')
    setAddAuctionForm({
      itemId: '',
      startPrice: '',
      stepPrice: '',
      minPrice: '',
      endTime: '',
    })
  }

  const selectedApprovedItem = useMemo(
    () => approvedItems.find((item) => item.id === addAuctionForm.itemId) || null,
    [approvedItems, addAuctionForm.itemId]
  )

  const filteredApprovedItems = useMemo(() => {
    const keyword = approvedItemsKeyword.trim().toLowerCase()
    if (!keyword) return approvedItems
    return approvedItems.filter((item) => {
      const itemName = (item.name || '').toLowerCase()
      const itemId = String(item.id || '').toLowerCase()
      return itemName.includes(keyword) || itemId.includes(keyword)
    })
  }, [approvedItems, approvedItemsKeyword])

  const handleAddAuctionToSession = async (event) => {
    event.preventDefault()
    if (!selectedSessionId) {
      setAdminError('Chọn session truoc khi them item vao session.')
      return
    }

    const startPrice = toOptionalNumber(addAuctionForm.startPrice)
    if (!addAuctionForm.itemId.trim() || startPrice == null || startPrice <= 0) {
      setAdminError('ItemId va startPrice hop le la bat buoc.')
      return
    }

    const payload = {
      itemId: addAuctionForm.itemId.trim(),
      rarity: selectedApprovedItem?.rarity || 'COMMON',
      startPrice,
    }

    const stepPrice = toOptionalNumber(addAuctionForm.stepPrice)
    const minPrice = toOptionalNumber(addAuctionForm.minPrice)

    if (stepPrice != null) payload.stepPrice = stepPrice
    if (minPrice != null) payload.minPrice = minPrice

    if (addAuctionForm.endTime) {
      const endTimeMs = new Date(addAuctionForm.endTime).getTime()
      if (!Number.isFinite(endTimeMs)) {
        setAdminError('Thời gian kết thúc không hợp lệ.')
        return
      }
      if (endTimeMs <= Date.now()) {
        setAdminError('Thời gian kết thúc phải ở tương lai.')
        return
      }
      payload.endTime = new Date(endTimeMs).toISOString()
    }

    await runAdminAction(() => addItemToSession(selectedSessionId, payload), {
      reloadTab: true,
      reloadOverview: false,
    })

    await loadSessionManagement(selectedSessionId)
    setAddAuctionForm((prev) => ({
      ...prev,
      itemId: '',
      startPrice: '',
      stepPrice: '',
      minPrice: '',
      endTime: '',
    }))
  }

  const handleLoadAuctionBids = async (auctionId) => {
    try {
      const response = await getAuctionBids(auctionId, 0, 20)
      setAuctionBidsByAuction((prev) => ({
        ...prev,
        [auctionId]: readApiData(response)?.content || [],
      }))
    } catch (error) {
      console.error('[AdminDashboard] Failed to load auction bids for moderation', error)
      setAdminError(error?.response?.data?.message || 'Không tải được danh sach bid.')
    }
  }

  const handleRemoveBid = async (auctionId, bidId) => {
    await runAdminAction(() => removeAuctionBid(auctionId, bidId), {
      reloadTab: false,
      reloadOverview: false,
    })
    await handleLoadAuctionBids(auctionId)
  }

  const handleLoadListingMessages = async () => {
    const listingId = listingIdForMessages.trim()
    if (!listingId) {
      setAdminError('Nhập listingId de tai lich su thuong luong.')
      return
    }

    setIsLoadingListingMessages(true)
    setAdminError(null)

    try {
      const response = await getListingMessagesForAdmin(listingId)
      setListingMessages(readApiData(response) || [])
    } catch (error) {
      console.error('[AdminDashboard] Failed to load listing messages for admin', error)
      setAdminError(error?.response?.data?.message || 'Không tải được tin nhan listing.')
    } finally {
      setIsLoadingListingMessages(false)
    }
  }

  const renderUsersTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quản lý người dùng</h2>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="border border-gray-200 rounded p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-gray-900">{u.nickname || u.email}</p>
                <p className="text-sm text-gray-600">{u.email} | role: {u.role}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleLoadUserDetail(u.id)} className="px-2 py-1 text-sm rounded bg-gray-700 text-white">Chi tiết</button>
                <button onClick={() => runAdminAction(() => changeUserRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN'))} className="px-2 py-1 text-sm rounded bg-indigo-600 text-white">Đổi vai trò</button>
                <button onClick={() => runAdminAction(() => muteUser(u.id))} className="px-2 py-1 text-sm rounded bg-amber-600 text-white">Tắt tiếng</button>
                <button onClick={() => runAdminAction(() => unmuteUser(u.id))} className="px-2 py-1 text-sm rounded bg-amber-500 text-white">Bỏ tắt tiếng</button>
                <button onClick={() => runAdminAction(() => banUser(u.id))} className="px-2 py-1 text-sm rounded bg-red-600 text-white">Khóa</button>
                <button onClick={() => runAdminAction(() => unbanUser(u.id))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Mở khóa</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={kickAuctionByUser[u.id] || ''}
                onChange={(e) => setKickAuctionByUser((prev) => ({ ...prev, [u.id]: e.target.value }))}
                placeholder="Nhập mã phòng đấu giá để đá"
                className="px-2 py-1 border border-gray-300 rounded text-sm flex-1 min-w-64"
              />
              <button onClick={() => handleKickUser(u.id)} className="px-2 py-1 text-sm rounded bg-rose-700 text-white">Đá khỏi phòng</button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-gray-600">Không có user nao.</p>}
      </div>

      {selectedUserDetail && (
        <div className="mt-5 border border-gray-200 rounded p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Chi tiết người dùng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
            <p>ID: {selectedUserDetail.id}</p>
            <p>Email: {selectedUserDetail.email || '-'}</p>
            <p>Nickname: {selectedUserDetail.nickname || '-'}</p>
            <p>Vai trò: {selectedUserDetail.role || '-'}</p>
            <p>Phone: {selectedUserDetail.phone || '-'}</p>
            <p>Address: {selectedUserDetail.address || '-'}</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderItemsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Duyệt vật phẩm</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600 mt-1">{item.description || 'Không có mo ta.'}</p>
              </div>
              <button onClick={() => handleLoadItemDetail(item.id)} className="px-2 py-1 text-sm rounded bg-gray-700 text-white">Chi tiết</button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <button onClick={() => runAdminAction(() => approveItem(item.id, { rarity: item.rarity || 'COMMON', tags: item.tags || [] }))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Duyệt</button>
              <input
                value={rejectReasonByItem[item.id] || ''}
                onChange={(e) => setRejectReasonByItem((prev) => ({ ...prev, [item.id]: e.target.value }))}
                placeholder="Lý do từ chối"
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => runAdminAction(() => rejectItem(item.id, { reason: rejectReasonByItem[item.id] || 'Không đạt tiêu chuẩn duyệt.' }))}
                className="px-2 py-1 text-sm rounded bg-red-600 text-white"
              >
                Từ chối
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-600">Không có item pending.</p>}
      </div>

      {selectedItemDetail && (
        <div className="mt-5 border border-gray-200 rounded p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Chi tiết vật phẩm</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
            <p>ID: {selectedItemDetail.id}</p>
            <p>Trạng thái: {selectedItemDetail.status || '-'}</p>
            <p>Name: {selectedItemDetail.name || '-'}</p>
            <p>Rarity: {selectedItemDetail.rarity || '-'}</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderTransactionsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Duyệt giao dịch chờ xử lý</h2>

      <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
        Từ API chờ duyệt: {pendingTransactions.length} giao dịch
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="border border-gray-200 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{tx.type} - {formatVnd(tx.amount)}</p>
              <p className="text-sm text-gray-600">{tx.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tx.type === 'DEPOSIT' ? (
                <>
                  <button onClick={() => runAdminAction(() => approveDeposit(tx.id))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Duyệt nạp</button>
                  <button onClick={() => runAdminAction(() => rejectDeposit(tx.id))} className="px-2 py-1 text-sm rounded bg-red-600 text-white">Từ chối nạp</button>
                </>
              ) : (
                <>
                  <button onClick={() => runAdminAction(() => approveWithdraw(tx.id))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Duyệt rút</button>
                  <button onClick={() => runAdminAction(() => rejectWithdraw(tx.id))} className="px-2 py-1 text-sm rounded bg-red-600 text-white">Từ chối rút</button>
                </>
              )}
              <button onClick={() => runAdminAction(() => approveTransaction(tx.id))} className="px-2 py-1 text-sm rounded bg-green-800 text-white">Duyệt tự động</button>
              <button onClick={() => runAdminAction(() => rejectTransaction(tx.id))} className="px-2 py-1 text-sm rounded bg-red-800 text-white">Từ chối tự động</button>
              <button onClick={() => runAdminAction(() => processTransaction(tx.id, 'COMPLETED'))} className="px-2 py-1 text-sm rounded bg-teal-700 text-white">Duyệt kiểu cũ</button>
              <button onClick={() => runAdminAction(() => processTransaction(tx.id, 'CANCELLED'))} className="px-2 py-1 text-sm rounded bg-rose-700 text-white">Từ chối kiểu cũ</button>
            </div>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-gray-600">Không có giao dịch pending.</p>}
      </div>
    </div>
  )

  const renderSessionsTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quản lý phiên</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          runAdminAction(() =>
            createSession({
              title: sessionForm.title,
              type: sessionForm.type,
              startTime: new Date(sessionForm.startTime).toISOString(),
            })
          )
        }}
        className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-2"
      >
        <input value={sessionForm.title} onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tiêu đề phiên" className="px-3 py-2 border border-gray-300 rounded" required />
        <select value={sessionForm.type} onChange={(e) => setSessionForm((prev) => ({ ...prev, type: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded">
          <option value="ENGLISH">ENGLISH</option>
          <option value="DUTCH">DUTCH</option>
          <option value="SEALED">SEALED</option>
        </select>
        <input type="datetime-local" value={sessionForm.startTime} onChange={(e) => setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded" required />
        <button className="px-3 py-2 rounded bg-blue-600 text-white">Tạo phiên</button>
      </form>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="border border-gray-200 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-600">{s.type} | {s.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => loadSessionManagement(s.id)} className="px-2 py-1 text-sm rounded bg-gray-700 text-white">Quản lý phòng</button>
              <button
                onClick={() => runAdminAction(() => activateSession(s.id))}
                disabled={s.status !== 'SCHEDULED'}
                className="px-2 py-1 text-sm rounded bg-emerald-600 text-white disabled:opacity-50"
              >
                Bắt đầu
              </button>
              <button
                onClick={() => runAdminAction(() => pauseSession(s.id))}
                disabled={s.status !== 'ACTIVE'}
                className="px-2 py-1 text-sm rounded bg-amber-600 text-white disabled:opacity-50"
              >
                Tạm dừng
              </button>
              <button
                onClick={() => runAdminAction(() => resumeSession(s.id))}
                disabled={s.status !== 'PAUSED'}
                className="px-2 py-1 text-sm rounded bg-indigo-600 text-white disabled:opacity-50"
              >
                Tiếp tục
              </button>
              <button
                onClick={() => runAdminAction(() => stopSession(s.id))}
                disabled={s.status === 'COMPLETED' || s.status === 'CANCELLED'}
                className="px-2 py-1 text-sm rounded bg-red-600 text-white disabled:opacity-50"
              >
                Kết thúc
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-gray-600">Không có session nao.</p>}
      </div>
    </div>
  )

  const renderSessionManagementModal = () => {
    if (!isSessionModalOpen || !selectedSessionId) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-xl bg-white shadow-xl">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quản lý phòng đấu giá</h3>
              <p className="text-sm text-gray-600">
                {selectedSessionDetail
                  ? `${selectedSessionDetail.title} (${selectedSessionDetail.type}) - ${selectedSessionDetail.status}`
                  : 'Đang tải thông tin phiên...'}
              </p>
            </div>
            <button onClick={closeSessionManagementModal} className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200">
              Đóng
            </button>
          </div>

          <div className="p-5 space-y-5">
            {isLoadingSessionDetail ? (
              <p className="text-sm text-gray-600">Đang tải chi tiết phiên...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                      <h4 className="font-semibold text-gray-900">Bước 1: Chọn vật phẩm đã duyệt</h4>
                      <input
                        value={approvedItemsKeyword}
                        onChange={(e) => setApprovedItemsKeyword(e.target.value)}
                        placeholder="Tìm theo tên hoặc mã vật phẩm"
                        className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    {isLoadingApprovedItems ? (
                      <p className="text-sm text-gray-600">Đang tải danh sách vật phẩm đã duyệt...</p>
                    ) : filteredApprovedItems.length === 0 ? (
                      <p className="text-sm text-gray-600">Không có vật phẩm đã duyệt khả dụng.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                        {filteredApprovedItems.map((item) => {
                          const isSelected = addAuctionForm.itemId === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAddAuctionForm((prev) => ({ ...prev, itemId: item.id }))}
                              className={`text-left border rounded p-3 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                            >
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-600 mt-1">ID: {item.id}</p>
                              <p className="text-xs text-gray-600 mt-1">Độ hiếm: {item.rarity || 'COMMON'}</p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Bước 2: Thiết lập đấu giá</h4>

                    {!selectedApprovedItem ? (
                      <p className="text-sm text-gray-600">Hãy chọn một vật phẩm đã duyệt trước khi nhập thông số đấu giá.</p>
                    ) : (
                      <form onSubmit={handleAddAuctionToSession} className="space-y-3">
                        <div className="rounded border border-blue-200 bg-blue-50 p-2 text-sm text-blue-900">
                          Đang chọn: {selectedApprovedItem.name} ({selectedApprovedItem.id})
                        </div>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={addAuctionForm.startPrice}
                          onChange={(e) => setAddAuctionForm((prev) => ({ ...prev, startPrice: e.target.value }))}
                          placeholder="Giá khởi điểm"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={addAuctionForm.stepPrice}
                          onChange={(e) => setAddAuctionForm((prev) => ({ ...prev, stepPrice: e.target.value }))}
                          placeholder="Bước giá"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={addAuctionForm.minPrice}
                          onChange={(e) => setAddAuctionForm((prev) => ({ ...prev, minPrice: e.target.value }))}
                          placeholder="Giá tối thiểu"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                        <input
                          type="datetime-local"
                          value={addAuctionForm.endTime}
                          onChange={(e) => setAddAuctionForm((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                        <button className="w-full px-3 py-2 rounded bg-blue-600 text-white">Thêm vật phẩm vào phiên</button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Danh sách phòng trong phiên</h4>
                  <div className="space-y-3">
                    {selectedSessionAuctions.map((auction) => (
                      <div key={auction.id} className="border border-gray-200 rounded p-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{auction.item?.name || auction.id}</p>
                            <p className="text-sm text-gray-600">{auction.status} | Giá hiện tại: {formatVnd(auction.currentPrice)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleLoadAuctionBids(auction.id)} className="px-2 py-1 text-sm rounded bg-slate-700 text-white">Tải lượt giá</button>
                            <button onClick={() => runAdminAction(() => resetAuctionTimer(auction.id), { reloadTab: false, reloadOverview: false })} className="px-2 py-1 text-sm rounded bg-cyan-700 text-white">Gia hạn thời gian</button>
                            <button
                              onClick={() => runAdminAction(() => removeAuctionFromSession(selectedSessionId, auction.id), { reloadTab: false, reloadOverview: false }).then(() => loadSessionManagement(selectedSessionId))}
                              disabled={selectedSessionDetail?.status !== 'SCHEDULED'}
                              className="px-2 py-1 text-sm rounded bg-red-700 text-white disabled:opacity-50"
                            >
                              Gỡ khỏi phiên
                            </button>
                          </div>
                        </div>

                        {Array.isArray(auctionBidsByAuction[auction.id]) && auctionBidsByAuction[auction.id].length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                            {auctionBidsByAuction[auction.id].map((bid) => (
                              <div key={bid.id} className="flex items-center justify-between text-sm border border-gray-200 rounded px-2 py-1">
                                <span>{bid.bidder?.nickname || 'Unknown'} - {formatVnd(bid.amount)}</span>
                                <button onClick={() => handleRemoveBid(auction.id, bid.id)} className="px-2 py-1 rounded bg-rose-700 text-white">Xóa lượt giá</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedSessionAuctions.length === 0 && <p className="text-sm text-gray-600">Phiên này chưa có phòng đấu giá.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderMarketModerationTab = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Điều phối tranh chấp chợ đen</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={listingIdForMessages}
          onChange={(e) => setListingIdForMessages(e.target.value)}
          placeholder="Nhập listing ID"
          className="px-3 py-2 border border-gray-300 rounded flex-1 min-w-64"
        />
        <button onClick={handleLoadListingMessages} className="px-3 py-2 rounded bg-blue-600 text-white">
          Tải tin nhắn tin đăng
        </button>
      </div>

      {isLoadingListingMessages ? (
        <p className="text-sm text-gray-600">Đang tải tin nhan...</p>
      ) : listingMessages.length === 0 ? (
        <p className="text-sm text-gray-600">Chưa có du lieu tin nhan moderation.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {listingMessages.map((msg) => (
            <div key={msg.id} className="border border-gray-200 rounded p-3">
              <p className="text-sm font-medium text-gray-900">{msg.sender?.nickname || 'Unknown'}</p>
              <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
              <p className="text-xs text-gray-500 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleString('vi-VN') : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    if (isLoadingTabData && tab !== 'market') {
      return <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">Đang tải du lieu...</div>
    }

    if (tab === 'users') return renderUsersTab()
    if (tab === 'items') return renderItemsTab()
    if (tab === 'transactions') return renderTransactionsTab()
    if (tab === 'sessions') return renderSessionsTab()
    return renderMarketModerationTab()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển quản trị</h1>
          <div className="flex items-center space-x-4">
            <Link to="/" className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200">
              Về trang chủ
            </Link>
            <span className="text-gray-700">Xin chào, {user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {overviewError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {overviewError}
          </div>
        )}
        {adminError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {adminError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Tổng người dùng</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.totalUsers ?? '-')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Vật phẩm chờ duyệt</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.totalItems ?? '-')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Doanh thu</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : formatVnd(overview?.totalRevenue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Yêu cầu nạp chờ duyệt</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.pendingDeposits ?? '-')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Yêu cầu rút chờ duyệt</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.pendingWithdrawals ?? '-')}</p>
          </div>
        </div>

        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Từ ngày</label>
              <input
                type="date"
                value={analyticsRange.from}
                onChange={(e) => setAnalyticsRange((prev) => ({ ...prev, from: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Đến ngày</label>
              <input
                type="date"
                value={analyticsRange.to}
                onChange={(e) => setAnalyticsRange((prev) => ({ ...prev, to: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <button onClick={loadAnalytics} className="px-3 py-2 rounded bg-slate-800 text-white">Tải lại thống kê</button>
          </div>

          {isLoadingAnalytics ? (
            <p className="text-sm text-gray-600">Đang tải thống kê chi tiết...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-600">Doanh thu trong khoảng</p>
                  <p className="text-lg font-semibold text-emerald-700">{formatVnd(revenue?.totalRevenue)}</p>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-600">Phòng đang hoạt động</p>
                  <p className="text-lg font-semibold">{auctionStats?.activeAuctions ?? '-'}</p>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-600">Tin đăng đang mở</p>
                  <p className="text-lg font-semibold">{marketStats?.activeListings ?? '-'}</p>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                <p>Tổng lượt trả giá: {auctionStats?.totalBids ?? '-'}</p>
                <p>Tổng giá trị đấu giá: {formatVnd(auctionStats?.totalVolume)}</p>
                <p>Tin đăng đã bán: {marketStats?.soldListings ?? '-'}</p>
                <p>Tổng giá trị chợ đen: {formatVnd(marketStats?.totalVolume)}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setTab('users')} className={`px-3 py-2 rounded text-sm ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Người dùng</button>
            <button onClick={() => setTab('items')} className={`px-3 py-2 rounded text-sm ${tab === 'items' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Vật phẩm</button>
            <button onClick={() => setTab('transactions')} className={`px-3 py-2 rounded text-sm ${tab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Giao dịch</button>
            <button onClick={() => setTab('sessions')} className={`px-3 py-2 rounded text-sm ${tab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Phiên</button>
            <button onClick={() => setTab('market')} className={`px-3 py-2 rounded text-sm ${tab === 'market' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Tranh chấp chợ đen</button>
          </div>

          {renderTabContent()}
        </div>
      </main>

      {renderSessionManagementModal()}
    </div>
  )
}

