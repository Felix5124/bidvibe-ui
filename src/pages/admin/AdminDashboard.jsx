import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../context/ToastContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StatCardSkeleton, UserCardSkeleton, ItemCardSkeleton, SessionCardSkeleton } from '../../components/Skeleton'
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
import PageHeaderFrame from '../../components/PageHeaderFrame'
import { formatRarity } from '../../utils/rarity'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null
const MIN_AUCTION_MINUTES = 10

const toDatetimeLocalValue = (date) => {
  const d = new Date(date)
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

const getDefaultAuctionEndTime = (sessionStartTime) => {
  const startMs = new Date(sessionStartTime).getTime()
  if (!Number.isFinite(startMs)) return ''
  return toDatetimeLocalValue(startMs + MIN_AUCTION_MINUTES * 60 * 1000)
}

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
  const { user: _user } = useAuthStore()
  const toast = useToast()
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
  const [sessionStatusFilter, setSessionStatusFilter] = useState('')
  const [sessionTypeFilter, setSessionTypeFilter] = useState('')
  const [sessionCounts, setSessionCounts] = useState({ SCHEDULED: 0, ACTIVE: 0, PAUSED: 0, COMPLETED: 0, CANCELLED: 0 })
  const [adminError, setAdminError] = useState(null)
  const [isLoadingTabData, setIsLoadingTabData] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const [rejectReasonByItem, setRejectReasonByItem] = useState({})
  const [kickAuctionByUser, setKickAuctionByUser] = useState({})
  const [selectedUserDetail, setSelectedUserDetail] = useState(null)
  const [selectedItemDetail, setSelectedItemDetail] = useState(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

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
  const [timerMinutesByAuction, setTimerMinutesByAuction] = useState({})
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

  const loadSessions = async (targetPage = 0, statusFilter = '', typeFilter = '') => {
    const filters = {}
    if (statusFilter) filters.status = statusFilter
    if (typeFilter) filters.type = typeFilter
    
    const response = await listSessions(filters, targetPage, 10)
    const payload = readApiData(response)
    setSessions(payload?.content || [])
    setSessionsMeta(payload?.meta || null)
  }

  const loadSessionCounts = async () => {
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
    
    setSessionCounts(counts)
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
      if (tab === 'sessions') {
        await Promise.all([
          loadSessions(targetPage, sessionStatusFilter, sessionTypeFilter),
          loadSessionCounts(),
        ])
      }
    } catch (error) {
      console.error('[AdminDashboard] Failed to load admin tab data', { tab, error })
      setAdminError(error?.response?.data?.message || 'Không tải được du lieu admin.')
    } finally {
      setIsLoadingTabData(false)
    }
  }, [tab, sessionStatusFilter, sessionTypeFilter])

  useEffect(() => {
    setUsersPage(0)
    setItemsPage(0)
    setTxPage(0)
    setSessionsPage(0)
    setSessionStatusFilter('')
    setSessionTypeFilter('')
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
  }, [tab, sessionsPage, sessionStatusFilter, sessionTypeFilter, loadTabData])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VND'
  }

  const runAdminAction = async (fn, options = {}) => {
    const { reloadTab = true, reloadOverview = true, successMessage } = options
    setAdminError(null)
    setIsProcessingAction(true)

    try {
      await fn()
      if (successMessage) {
        toast.success(successMessage)
      }
      if (reloadTab) {
        await loadTabData()
      }
      if (reloadOverview) {
        await loadOverview()
      }
    } catch (error) {
      const statusCode = error?.response?.status
      const errorMessage = error?.response?.data?.message || 'Thao tác thất bại.'
      
      if (statusCode === 409 || statusCode === 400) {
        console.warn('[AdminDashboard] Admin action conflict/bad request', error?.response?.data)
        toast.warning(errorMessage)
      } else {
        console.error('[AdminDashboard] Admin action failed', error)
        toast.error(errorMessage)
      }
    } finally {
      setIsProcessingAction(false)
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
      setIsItemModalOpen(true)
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
      const sessionDetail = readApiData(detailRes)
      setSelectedSessionDetail(sessionDetail)
      setSelectedSessionAuctions(readApiData(auctionsRes) || [])
      setAuctionBidsByAuction({})
      setAddAuctionForm({
        itemId: '',
        startPrice: '',
        stepPrice: '',
        minPrice: '',
        endTime: getDefaultAuctionEndTime(sessionDetail?.startTime),
      })
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
    setTimerMinutesByAuction({})
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
      toast.warning('Chọn session trước khi thêm vật phẩm.')
      return
    }
    if (isProcessingAction) {
      return
    }

    const startPrice = toOptionalNumber(addAuctionForm.startPrice)
    if (!addAuctionForm.itemId.trim() || startPrice == null || startPrice <= 0) {
      toast.warning('ItemId và startPrice hợp lệ là bắt buộc.')
      return
    }

    if (selectedSessionDetail?.type === 'DUTCH') {
      const minPrice = toOptionalNumber(addAuctionForm.minPrice)
      if (minPrice == null || minPrice <= 0) {
        toast.warning('Đấu giá giảm dần (Dutch) yêu cầu giá sàn (minPrice) phải lớn hơn 0.')
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
        toast.error('Thời gian kết thúc không hợp lệ.')
        return
      }
      if (endTimeMs <= Date.now()) {
        toast.error('Thời gian kết thúc phải ở tương lai.')
        return
      }

      const sessionStartMs = new Date(selectedSessionDetail?.startTime).getTime()
      if (Number.isFinite(sessionStartMs)) {
        const minEndMs = sessionStartMs + MIN_AUCTION_MINUTES * 60 * 1000
        if (endTimeMs < minEndMs) {
          toast.error(`Giờ kết thúc tối thiểu phải là giờ bắt đầu + ${MIN_AUCTION_MINUTES} phút.`)
          return
        }
      }
      payload.endTime = new Date(endTimeMs).toISOString()
    } else {
      const fallbackEndTime = getDefaultAuctionEndTime(selectedSessionDetail?.startTime)
      if (!fallbackEndTime) {
        toast.error('Không xác định được thời gian bắt đầu phiên để đặt giờ kết thúc mặc định.')
        return
      }
      payload.endTime = new Date(fallbackEndTime).toISOString()
    }

    setIsProcessingAction(true)
    try {
      await addItemToSession(selectedSessionId, payload)
      toast.success('Đã thêm vật phẩm vào phiên.')
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
        toast.warning(error?.response?.data?.message || 'Vật phẩm đã có trong phiên đấu giá khác.')
      } else {
        console.error('[AdminDashboard] Add auction failed', error)
        toast.error(error?.response?.data?.message || 'Không thể thêm vật phẩm vào phiên.')
      }
    } finally {
      setIsProcessingAction(false)
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
                <button onClick={() => handleLoadUserDetail(u.id)} className="px-2 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-800 transition-colors" disabled={isProcessingAction}>Chi tiết</button>
                <button onClick={() => runAdminAction(() => changeUserRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN'), { successMessage: 'Đã đổi vai trò người dùng.' })} className="px-2 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Đổi vai trò</button>
                <button onClick={() => runAdminAction(() => muteUser(u.id), { successMessage: 'Đã tắt tiếng người dùng.' })} className="px-2 py-1 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Tắt tiếng</button>
                <button onClick={() => runAdminAction(() => unmuteUser(u.id), { successMessage: 'Đã bỏ tắt tiếng người dùng.' })} className="px-2 py-1 text-sm rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Bỏ tắt tiếng</button>
                <button onClick={() => runAdminAction(() => banUser(u.id), { successMessage: 'Đã khóa người dùng.' })} className="px-2 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Khóa</button>
                <button onClick={() => runAdminAction(() => unbanUser(u.id), { successMessage: 'Đã mở khóa người dùng.' })} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Mở khóa</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={kickAuctionByUser[u.id] || ''}
                onChange={(e) => setKickAuctionByUser((prev) => ({ ...prev, [u.id]: e.target.value }))}
                placeholder="Nhập mã phòng đấu giá để đá"
                className="px-2 py-1 border border-gray-300 rounded text-sm flex-1 min-w-64"
              />
              <button onClick={() => handleKickUser(u.id)} className="px-2 py-1 text-sm rounded bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Đá khỏi phòng</button>
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
              <button onClick={() => handleLoadItemDetail(item.id)} className="px-2 py-1 text-sm rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Chi tiết</button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <button onClick={() => runAdminAction(() => approveItem(item.id, { rarity: item.rarity || 'COMMON', tags: item.tags || [] }), { successMessage: 'Đã duyệt vật phẩm.' })} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Duyệt</button>
              <input
                value={rejectReasonByItem[item.id] || ''}
                onChange={(e) => setRejectReasonByItem((prev) => ({ ...prev, [item.id]: e.target.value }))}
                placeholder="Lý do từ chối"
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => runAdminAction(() => rejectItem(item.id, { reason: rejectReasonByItem[item.id] || 'Không đạt tiêu chuẩn duyệt.' }), { successMessage: 'Đã từ chối vật phẩm.' })}
                className="px-2 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessingAction}
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
                  <button onClick={() => runAdminAction(() => approveDeposit(tx.id), { successMessage: 'Đã duyệt yêu cầu nạp tiền.' })} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Duyệt nạp</button>
                  <button onClick={() => runAdminAction(() => rejectDeposit(tx.id), { successMessage: 'Đã từ chối yêu cầu nạp tiền.' })} className="px-2 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Từ chối nạp</button>
                </>
              ) : (
                <>
                  <button onClick={() => runAdminAction(() => approveWithdraw(tx.id), { successMessage: 'Đã duyệt yêu cầu rút tiền.' })} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Duyệt rút</button>
                  <button onClick={() => runAdminAction(() => rejectWithdraw(tx.id), { successMessage: 'Đã từ chối yêu cầu rút tiền.' })} className="px-2 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Từ chối rút</button>
                </>
              )}
              <button onClick={() => runAdminAction(() => approveTransaction(tx.id), { successMessage: 'Đã duyệt giao dịch.' })} className="px-2 py-1 text-sm rounded bg-green-800 text-white hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Duyệt tự động</button>
              <button onClick={() => runAdminAction(() => rejectTransaction(tx.id), { successMessage: 'Đã từ chối giao dịch.' })} className="px-2 py-1 text-sm rounded bg-red-800 text-white hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Từ chối tự động</button>
              <button onClick={() => runAdminAction(() => processTransaction(tx.id, 'COMPLETED'), { successMessage: 'Đã xử lý giao dịch.' })} className="px-2 py-1 text-sm rounded bg-teal-700 text-white hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Duyệt kiểu cũ</button>
              <button onClick={() => runAdminAction(() => processTransaction(tx.id, 'CANCELLED'), { successMessage: 'Đã hủy giao dịch.' })} className="px-2 py-1 text-sm rounded bg-rose-700 text-white hover:bg-rose-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Từ chối kiểu cũ</button>
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

  const renderSessionsTab = () => {
    const sessionStatuses = [
      { key: '', label: 'Tất cả', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      { key: 'SCHEDULED', label: 'Chờ bắt đầu', color: 'bg-blue-50 text-blue-700 border-blue-300' },
      { key: 'ACTIVE', label: 'Đang diễn ra', color: 'bg-green-50 text-green-700 border-green-300' },
      { key: 'PAUSED', label: 'Tạm dừng', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
      { key: 'COMPLETED', label: 'Hoàn thành', color: 'bg-gray-200 text-gray-600 border-gray-400' },
      { key: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-300' },
    ]

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Quản lý phiên đấu giá</h2>
          <div className="flex items-center gap-3">
            <select
              value={sessionTypeFilter}
              onChange={(e) => setSessionTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Tất cả loại</option>
              <option value="ENGLISH">English</option>
              <option value="DUTCH">Dutch</option>
              <option value="SEALED">Sealed Bid</option>
            </select>
          </div>
        </div>

        {/* Sub-tabs for status */}
        <div className="flex flex-wrap gap-2 mb-5">
          {sessionStatuses.map((status) => {
            const count = status.key === '' 
              ? Object.values(sessionCounts).reduce((a, b) => a + b, 0)
              : sessionCounts[status.key] || 0
            const isActive = sessionStatusFilter === status.key
            return (
              <button
                key={status.key}
                onClick={() => setSessionStatusFilter(status.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                  isActive
                    ? `${status.color} ring-2 ring-offset-1 ring-blue-300`
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status.label}
                {status.key !== 'COMPLETED' && status.key !== 'CANCELLED' && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/50' : 'bg-gray-100'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Create session form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const startMs = new Date(sessionForm.startTime).getTime()
            if (!Number.isFinite(startMs)) {
              toast.error('Thời gian bắt đầu không hợp lệ.')
              return
            }
            if (startMs <= Date.now()) {
              toast.error('Thời gian bắt đầu phải ở tương lai.')
              return
            }
            runAdminAction(
              () =>
                createSession({
                  title: sessionForm.title,
                  type: sessionForm.type,
                  startTime: new Date(sessionForm.startTime).toISOString(),
                }),
              { successMessage: 'Đã tạo phiên đấu giá thành công.' }
            )
            setSessionForm({ title: '', type: 'ENGLISH', startTime: '' })
          }}
          className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <input value={sessionForm.title} onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tiêu đề phiên" className="px-3 py-2 border border-gray-300 rounded" required />
          <select value={sessionForm.type} onChange={(e) => setSessionForm((prev) => ({ ...prev, type: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded">
            <option value="ENGLISH">English (Lên giá)</option>
            <option value="DUTCH">Dutch (Xuống giá)</option>
            <option value="SEALED">Sealed Bid (Kín)</option>
          </select>
          <input type="datetime-local" value={sessionForm.startTime} onChange={(e) => setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded" required />
          <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Tạo phiên</button>
        </form>

        {/* Sessions list */}
        <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="border border-gray-200 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-600">{s.type} | {s.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => loadSessionManagement(s.id)} className="px-2 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>Quản lý phòng</button>
              <button
                onClick={() => runAdminAction(() => activateSession(s.id), { successMessage: 'Đã bắt đầu phiên đấu giá.' })}
                disabled={s.status !== 'SCHEDULED' || isProcessingAction}
                className="px-2 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bắt đầu
              </button>
              <button
                onClick={() => runAdminAction(() => pauseSession(s.id), { successMessage: 'Đã tạm dừng phiên đấu giá.' })}
                disabled={s.status !== 'ACTIVE' || isProcessingAction}
                className="px-2 py-1 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tạm dừng
              </button>
              <button
                onClick={() => runAdminAction(() => resumeSession(s.id), { successMessage: 'Đã tiếp tục phiên đấu giá.' })}
                disabled={s.status !== 'PAUSED' || isProcessingAction}
                className="px-2 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
              <button
                onClick={() => runAdminAction(() => stopSession(s.id), { successMessage: 'Đã kết thúc phiên đấu giá.' })}
                disabled={s.status === 'COMPLETED' || s.status === 'CANCELLED' || isProcessingAction}
                className="px-2 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kết thúc
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-gray-600">Không có phiên nào phù hợp bộ lọc.</p>}
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
  }

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
                          <button onClick={() => handleLoadAuctionBids(auction.id)} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>
                            Lịch sử giá
                          </button>
                          <button onClick={() => {
                            runAdminAction(() => resetAuctionTimer(auction.id, MIN_AUCTION_MINUTES), { reloadTab: false, reloadOverview: false, successMessage: `Đã cộng thêm ${MIN_AUCTION_MINUTES} phút.` })
                          }} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>
                            + Thời gian
                          </button>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={MIN_AUCTION_MINUTES}
                              value={timerMinutesByAuction[auction.id] || MIN_AUCTION_MINUTES}
                              onChange={(e) => setTimerMinutesByAuction((prev) => ({ ...prev, [auction.id]: e.target.value }))}
                              className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                            />
                            <button
                              onClick={() => {
                                const minutes = Number(timerMinutesByAuction[auction.id] || MIN_AUCTION_MINUTES)
                                if (!Number.isFinite(minutes) || minutes < MIN_AUCTION_MINUTES) {
                                  toast.warning(`Thời gian tối thiểu là ${MIN_AUCTION_MINUTES} phút.`)
                                  return
                                }
                                runAdminAction(
                                  () => resetAuctionTimer(auction.id, minutes),
                                  { reloadTab: false, reloadOverview: false, successMessage: `Đã cộng thêm ${minutes} phút.` }
                                )
                              }}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isProcessingAction}
                            >
                              Đặt phút
                            </button>
                          </div>
                          <button
                            onClick={async () => {
                              setIsProcessingAction(true)
                              try {
                                await removeAuctionFromSession(selectedSessionId, auction.id)
                                toast.success('Đã gỡ bỏ vật phẩm khỏi phiên.')
                                await loadSessionManagement(selectedSessionId)
                              } catch (error) {
                                console.error('[AdminDashboard] Remove auction failed', error)
                                toast.error(error?.response?.data?.message || 'Không thể gỡ bỏ vật phẩm.')
                              } finally {
                                setIsProcessingAction(false)
                              }
                            }}
                            disabled={!isScheduled || isProcessingAction}
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
                          onClick={() => setAddAuctionForm((prev) => ({
                            ...prev,
                            itemId: item.id,
                            endTime: getDefaultAuctionEndTime(selectedSessionDetail?.startTime),
                          }))}
                          className={`w-full text-left border rounded-xl p-3 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                        >
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[11px] text-slate-500 font-mono">{item.id.split('-')[0]}...</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {formatRarity(item.rarity || 'COMMON')}
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
                          <button
                            type="button"
                            onClick={() => setAddAuctionForm((p) => ({ ...p, endTime: getDefaultAuctionEndTime(selectedSessionDetail?.startTime) }))}
                            className="mt-1 text-[11px] text-indigo-600 hover:text-indigo-700"
                          >
                            Đặt mặc định: bắt đầu + {MIN_AUCTION_MINUTES} phút
                          </button>
                          <p className="text-[11px] text-slate-500 mt-1">Chỉ được tăng thêm, không được giảm dưới mốc bắt đầu + {MIN_AUCTION_MINUTES} phút.</p>
                        </div>
                      </div>
                      
                      <button type="submit" className="w-full mt-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessingAction}>
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
      if (tab === 'users') {
        return (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        )
      }
      if (tab === 'items') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        )
      }
      if (tab === 'sessions') {
        return (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        )
      }
      return <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">Đang tải dữ liệu...</div>
    }

    if (tab === 'users') return renderUsersTab()
    if (tab === 'items') return renderItemsTab()
    if (tab === 'transactions') return renderTransactionsTab()
    if (tab === 'sessions') return renderSessionsTab()
    return renderMarketModerationTab()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 px-4">
        <PageHeaderFrame
          title="Bảng điều khiển quản trị"
          description="Theo dõi sức khỏe hệ thống, duyệt dữ liệu và điều phối toàn bộ phiên đấu giá."
        />

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

      {/* Modal chi tiết vật phẩm */}
      {isItemModalOpen && selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex-none border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chi tiết vật phẩm</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-indigo-700">{selectedItemDetail.name || 'Không có tên'}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border bg-white ${selectedItemDetail.status === 'APPROVED' ? 'border-emerald-300 text-emerald-700' : selectedItemDetail.status === 'REJECTED' ? 'border-rose-300 text-rose-700' : 'border-amber-300 text-amber-700'}`}>
                    {selectedItemDetail.status || 'PENDING'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsItemModalOpen(false)} className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
                Đóng
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Hình ảnh và thông tin cơ bản */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Hình ảnh */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-slate-800 mb-3">Hình ảnh vật phẩm</h4>
                    {(() => {
                      const images = selectedItemDetail?.imageUrls || (selectedItemDetail?.imageUrl ? [selectedItemDetail.imageUrl] : []);
                      if (images.length > 0) {
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              {images.slice(0, 4).map((url, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                                  <img 
                                    src={url} 
                                    alt={`${selectedItemDetail.name} - ${index + 1}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="%23f1f5f9"><rect width="100" height="100"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em">Hình ${index + 1}</text></svg>'
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            {images.length > 4 && (
                              <p className="text-xs text-slate-500 mt-2 text-center">
                                + {images.length - 4} hình ảnh khác
                              </p>
                            )}
                          </>
                        );
                      }
                      return (
                        <div className="flex flex-col items-center justify-center py-8 bg-linear-to-br from-blue-50 to-purple-50 border-2 border-dashed border-slate-200 rounded-lg">
                          <span className="text-5xl mb-2">📦</span>
                          <p className="text-slate-600 text-sm">Không có hình ảnh</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Thông tin cơ bản */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-slate-800 mb-3">Thông tin cơ bản</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Mã vật phẩm:</span>
                        <span className="font-mono font-medium text-slate-900">{selectedItemDetail.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Trạng thái:</span>
                        <span className={`font-medium ${selectedItemDetail.status === 'APPROVED' ? 'text-emerald-700' : selectedItemDetail.status === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'}`}>
                          {selectedItemDetail.status || 'PENDING'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Phân loại:</span>
                        <span className="font-medium text-slate-900">{formatRarity(selectedItemDetail.rarity || 'COMMON')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Người gửi:</span>
                        <span className="font-medium text-slate-900">{selectedItemDetail.seller?.nickname || selectedItemDetail.seller?.email || 'Ẩn danh'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ngày gửi:</span>
                        <span className="font-medium text-slate-900">
                          {selectedItemDetail.createdAt ? new Date(selectedItemDetail.createdAt).toLocaleString('vi-VN') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Chi tiết */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Tên và mô tả */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h4 className="font-bold text-slate-800 mb-3">Thông tin chi tiết</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên vật phẩm</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-medium">
                          {selectedItemDetail.name || 'Không có tên'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 whitespace-pre-wrap min-h-30">
                          {selectedItemDetail.description || 'Không có mô tả'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Thông tin bổ sung</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700">
                          {selectedItemDetail.additionalInfo || 'Không có thông tin bổ sung'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags và phân loại */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h4 className="font-bold text-slate-800 mb-3">Phân loại</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedItemDetail.tags && selectedItemDetail.tags.length > 0 ? (
                            selectedItemDetail.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-sm">Không có tags</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Danh mục</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedItemDetail.categories && selectedItemDetail.categories.length > 0 ? (
                            selectedItemDetail.categories.map((category, index) => (
                              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full border border-purple-200">
                                {category}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-sm">Không có danh mục</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin đấu giá (nếu có) */}
                  {selectedItemDetail.auctionInfo && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <h4 className="font-bold text-slate-800 mb-3">Thông tin đấu giá</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Giá khởi điểm:</span>
                          <p className="font-medium text-slate-900">{formatVnd(selectedItemDetail.auctionInfo.startPrice)}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Bước giá:</span>
                          <p className="font-medium text-slate-900">{formatVnd(selectedItemDetail.auctionInfo.stepPrice)}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Giá mua ngay:</span>
                          <p className="font-medium text-slate-900">{formatVnd(selectedItemDetail.auctionInfo.buyNowPrice) || 'Không có'}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Thời gian kết thúc:</span>
                          <p className="font-medium text-slate-900">
                            {selectedItemDetail.auctionInfo.endTime ? new Date(selectedItemDetail.auctionInfo.endTime).toLocaleString('vi-VN') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer với các nút hành động */}
            <div className="flex-none border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Vật phẩm ID: <span className="font-mono">{selectedItemDetail.id}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    runAdminAction(() => approveItem(selectedItemDetail.id, { 
                      rarity: selectedItemDetail.rarity || 'COMMON', 
                      tags: selectedItemDetail.tags || [] 
                    }), { 
                      successMessage: 'Đã duyệt vật phẩm.',
                      onSuccess: () => setIsItemModalOpen(false)
                    })
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Duyệt vật phẩm
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Nhập lý do từ chối:', 'Không đạt tiêu chuẩn duyệt.')
                    if (reason) {
                      runAdminAction(() => rejectItem(selectedItemDetail.id, { reason }), { 
                        successMessage: 'Đã từ chối vật phẩm.',
                        onSuccess: () => setIsItemModalOpen(false)
                      })
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

