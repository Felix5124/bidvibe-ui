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
  const [usersMeta, setUsersMeta] = useState(null)
  const [usersPage, setUsersPage] = useState(0)
  const [items, setItems] = useState([])
  const [itemsMeta, setItemsMeta] = useState(null)
  const [itemsPage, setItemsPage] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [txMeta, setTxMeta] = useState(null)
  const [txPage, setTxPage] = useState(0)
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionsMeta, setSessionsMeta] = useState(null)
  const [sessionsPage, setSessionsPage] = useState(0)
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
  const [, setIsLoadingSessionDetail] = useState(false)
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

  const loadUsers = async (targetPage = 0) => {
    const response = await listUsers({}, targetPage, 15)
    const payload = readApiData(response)
    setUsers(payload?.content || [])
    setUsersMeta(payload?.meta || null)
  }

  const loadItems = async (targetPage = 0) => {
    const response = await listItems({ status: 'PENDING' }, targetPage, 15)
    const payload = readApiData(response)
    setItems(payload?.content || [])
    setItemsMeta(payload?.meta || null)
  }

  const loadTransactions = async (targetPage = 0) => {
    const [pagedRes, pendingRes] = await Promise.all([
      listTransactions({ status: 'PENDING' }, targetPage, 15),
      getPendingTransactions(),
    ])

    const payload = readApiData(pagedRes)
    setTransactions(payload?.content || [])
    setTxMeta(payload?.meta || null)
    setPendingTransactions(readApiData(pendingRes) || [])
  }

  const loadSessions = async (targetPage = 0) => {
    const response = await listSessions({}, targetPage, 10)
    const payload = readApiData(response)
    setSessions(payload?.content || [])
    setSessionsMeta(payload?.meta || null)
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

  const loadTabData = useCallback(async (targetPage = 0) => {
    setIsLoadingTabData(true)
    setAdminError(null)

    try {
      if (tab === 'users') await loadUsers(targetPage)
      if (tab === 'items') await loadItems(targetPage)
      if (tab === 'transactions') await loadTransactions(targetPage)
      if (tab === 'sessions') await loadSessions(targetPage)
    } catch (error) {
      console.error('[AdminDashboard] Failed to load admin tab data', { tab, error })
      setAdminError(error?.response?.data?.message || 'Không tải được du lieu admin.')
    } finally {
      setIsLoadingTabData(false)
    }
  }, [tab])

  useEffect(() => {
    setUsersPage(0)
    setItemsPage(0)
    setTxPage(0)
    setSessionsPage(0)
  }, [tab])

  useEffect(() => {
    if (tab === 'users') loadTabData(usersPage)
  }, [tab, usersPage, loadTabData])

  useEffect(() => {
    if (tab === 'items') loadTabData(itemsPage)
  }, [tab, itemsPage, loadTabData])

  useEffect(() => {
    if (tab === 'transactions') loadTabData(txPage)
  }, [tab, txPage, loadTabData])

  useEffect(() => {
    if (tab === 'sessions') loadTabData(sessionsPage)
  }, [tab, sessionsPage, loadTabData])

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

    if (selectedSessionDetail?.type === 'DUTCH') {
      const minPrice = toOptionalNumber(addAuctionForm.minPrice)
      if (minPrice == null || minPrice <= 0) {
        setAdminError('Đấu giá giảm dần (Dutch) yêu cầu giá sàn (minPrice) phải lớn hơn 0.')
        return
      }
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

    setAdminError(null)
    try {
      await addItemToSession(selectedSessionId, payload)
      await loadSessionManagement(selectedSessionId)
      setAddAuctionForm((prev) => ({
        ...prev,
        itemId: '',
        startPrice: '',
        stepPrice: '',
        minPrice: '',
        endTime: '',
      }))
    } catch (error) {
      const statusCode = error?.response?.status
      if (statusCode === 409) {
        console.warn('[AdminDashboard] Add auction conflict', error?.response?.data)
        setAdminError(error?.response?.data?.message || 'Vật phẩm đã có trong phiên đấu giá khác.')
      } else {
        console.error('[AdminDashboard] Add auction failed', error)
        setAdminError(error?.response?.data?.message || 'Không thể thêm vật phẩm vào phiên.')
      }
    }
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

      {usersMeta && usersMeta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-sm text-gray-600">
            Trang {(usersMeta.page || 0) + 1} / {Math.max(usersMeta.totalPages, 1)} — {usersMeta.totalElements || 0} user
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setUsersPage((p) => Math.max(0, p - 1))} disabled={usersPage === 0 || isLoadingTabData} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">← Trước</button>
            <button type="button" onClick={() => setUsersPage((p) => Math.min(usersMeta.totalPages - 1, p + 1))} disabled={usersPage >= usersMeta.totalPages - 1 || isLoadingTabData} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Sau →</button>
          </div>
        </div>
      )}

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

      {itemsMeta && itemsMeta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-sm text-gray-600">
            Trang {(itemsMeta.page || 0) + 1} / {Math.max(itemsMeta.totalPages, 1)} — {itemsMeta.totalElements || 0} vật phẩm
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setItemsPage((p) => Math.max(0, p - 1))} disabled={itemsPage === 0 || isLoadingTabData} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">← Trước</button>
            <button type="button" onClick={() => setItemsPage((p) => Math.min(itemsMeta.totalPages - 1, p + 1))} disabled={itemsPage >= itemsMeta.totalPages - 1 || isLoadingTabData} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Sau →</button>
          </div>
        </div>
      )}

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

      {txMeta && txMeta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-sm text-gray-600">
            Trang {(txMeta.page || 0) + 1} / {Math.max(txMeta.totalPages, 1)} — {txMeta.totalElements || 0} giao dịch
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setTxPage((p) => Math.max(0, p - 1))} disabled={txPage === 0 || isLoadingTabData} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">← Trước</button>
            <button type="button" onClick={() => setTxPage((p) => Math.min(txMeta.totalPages - 1, p + 1))} disabled={txPage >= txMeta.totalPages - 1 || isLoadingTabData} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Sau →</button>
          </div>
        </div>
      )}
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

      {sessionsMeta && sessionsMeta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-sm text-gray-600">
            Trang {(sessionsMeta.page || 0) + 1} / {Math.max(sessionsMeta.totalPages, 1)} — {sessionsMeta.totalElements || 0} phiên
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSessionsPage((p) => Math.max(0, p - 1))}
              disabled={sessionsPage === 0 || isLoadingTabData}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
              {sessionsPage + 1} / {sessionsMeta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setSessionsPage((p) => Math.min(sessionsMeta.totalPages - 1, p + 1))}
              disabled={sessionsPage >= sessionsMeta.totalPages - 1 || isLoadingTabData}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderSessionManagementModal = () => {
    if (!isSessionModalOpen || !selectedSessionId) return null

    const isScheduled = selectedSessionDetail?.status === 'SCHEDULED';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity">
        <div className="w-full max-w-7xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
          
          {/* HEADER */}
          <div className="flex-none border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Quản lý phòng đấu giá</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-indigo-700">{selectedSessionDetail?.title || 'Đang tải...'}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{selectedSessionDetail?.type}</span>
                <span className="text-gray-400">•</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border bg-white ${selectedSessionDetail?.status === 'ACTIVE' ? 'border-emerald-300 text-emerald-700' : 'border-slate-300 text-slate-700'}`}>
                  {selectedSessionDetail?.status}
                </span>
              </div>
            </div>
            <button onClick={closeSessionManagementModal} className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
              Đóng cửa sổ
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* CỘT TRÁI: DANH SÁCH PHÒNG TRONG PHIÊN (Chiếm phần lớn diện tích) */}
            <div className={`flex flex-col p-6 overflow-y-auto ${isScheduled ? 'lg:w-2/3 border-r border-slate-200' : 'w-full'}`}>
              <h4 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>Danh sách vật phẩm trong phiên ({selectedSessionAuctions.length})</span>
                {!isScheduled && (
                  <span className="text-sm font-normal text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Phiên đã chốt, không thể thêm vật phẩm mới
                  </span>
                )}
              </h4>
              
              {selectedSessionAuctions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="text-slate-600 font-medium">Phiên này chưa có vật phẩm nào</p>
                  {isScheduled && <p className="text-sm text-slate-500 mt-1">Hãy chọn vật phẩm từ danh sách bên phải để thêm vào phiên.</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSessionAuctions.map((auction) => (
                    <div key={auction.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
                      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Thumbnail giả lập nếu ko có ảnh */}
                          <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <span className="text-xl">📦</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{auction.item?.name || 'Vật phẩm chưa đặt tên'}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-slate-600">Trạng thái: <strong className="text-slate-800">{auction.status}</strong></span>
                              <span className="text-slate-300">|</span>
                              <span className="text-sm text-slate-600">Giá: <strong className="text-emerald-600">{formatVnd(auction.currentPrice)}</strong></span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button onClick={() => handleLoadAuctionBids(auction.id)} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors">
                            Lịch sử giá
                          </button>
                          <button onClick={() => runAdminAction(() => resetAuctionTimer(auction.id), { reloadTab: false, reloadOverview: false })} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors">
                            + Thời gian
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await removeAuctionFromSession(selectedSessionId, auction.id)
                                await loadSessionManagement(selectedSessionId)
                              } catch (error) {
                                console.error('[AdminDashboard] Remove auction failed', error)
                                setAdminError(error?.response?.data?.message || 'Không thể gỡ bỏ vật phẩm.')
                              }
                            }}
                            disabled={!isScheduled}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Gỡ bỏ
                          </button>
                        </div>
                      </div>

                      {/* KHU VỰC HIỂN THỊ BIDS (Chỉ hiện khi bấm tải lịch sử giá) */}
                      {Array.isArray(auctionBidsByAuction[auction.id]) && (
                        <div className="border-t border-slate-100 bg-slate-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-bold text-slate-700">Lịch sử trả giá ({auctionBidsByAuction[auction.id].length})</h5>
                            <button onClick={() => setAuctionBidsByAuction(prev => ({...prev, [auction.id]: null}))} className="text-xs text-slate-500 hover:text-slate-700 underline">Đóng</button>
                          </div>
                          {auctionBidsByAuction[auction.id].length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Chưa có ai trả giá.</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {auctionBidsByAuction[auction.id].map((bid) => (
                                <div key={bid.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800">{bid.bidder?.nickname || 'Ẩn danh'}</span>
                                    {bid.proxy && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Auto</span>}
                                    <span className="text-slate-400 mx-1">-</span>
                                    <span className="font-bold text-emerald-600">{formatVnd(bid.amount)}</span>
                                  </div>
                                  <button onClick={() => handleRemoveBid(auction.id, bid.id)} className="px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-medium transition-colors">
                                    Xóa lượt giá
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: THÊM VẬT PHẨM (CHỈ HIỆN KHI SCHEDULED) */}
            {isScheduled && (
              <div className="flex flex-col bg-slate-50 lg:w-1/3 border-l border-slate-200">
                <div className="p-5 border-b border-slate-200 bg-white">
                  <h4 className="font-bold text-slate-800 mb-3">Kho vật phẩm đã duyệt</h4>
                  <input
                    value={approvedItemsKeyword}
                    onChange={(e) => setApprovedItemsKeyword(e.target.value)}
                    placeholder="🔍 Tìm tên hoặc mã vật phẩm..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Danh sách chọn đồ */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
                  {isLoadingApprovedItems ? (
                    <p className="text-sm text-slate-500 text-center py-4">Đang tải kho...</p>
                  ) : filteredApprovedItems.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Không có vật phẩm phù hợp.</p>
                  ) : (
                    filteredApprovedItems.map((item) => {
                      const isSelected = addAuctionForm.itemId === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAddAuctionForm((prev) => ({ ...prev, itemId: item.id }))}
                          className={`w-full text-left border rounded-xl p-3 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                        >
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[11px] text-slate-500 font-mono">{item.id.split('-')[0]}...</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {item.rarity || 'COMMON'}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Form thiết lập giá (Luôn bám ở dưới cùng cột phải) */}
                <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                  <h4 className="font-bold text-slate-800 mb-3">Thiết lập cấu hình</h4>
                  {!selectedApprovedItem ? (
                    <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                      Vui lòng chọn 1 vật phẩm ở trên
                    </div>
                  ) : (
                    <form onSubmit={handleAddAuctionToSession} className="space-y-3">
                      <div className="text-sm font-medium text-indigo-700 truncate bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                        {selectedApprovedItem.name}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Giá khởi điểm *</label>
                          <input type="number" min="1" value={addAuctionForm.startPrice} onChange={(e) => setAddAuctionForm(p => ({ ...p, startPrice: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bước giá</label>
                          <input type="number" min="0" value={addAuctionForm.stepPrice} onChange={(e) => setAddAuctionForm(p => ({ ...p, stepPrice: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Giá sàn (Dutch)</label>
                          <input type="number" min="0" value={addAuctionForm.minPrice} onChange={(e) => setAddAuctionForm(p => ({ ...p, minPrice: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Giờ kết thúc</label>
                          <input type="datetime-local" value={addAuctionForm.endTime} onChange={(e) => setAddAuctionForm(p => ({ ...p, endTime: e.target.value }))} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      
                      <button type="submit" className="w-full mt-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Thêm vào phiên
                      </button>
                    </form>
                  )}
                </div>
              </div>
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

