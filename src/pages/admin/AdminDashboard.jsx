import { useAuthStore } from '../../store/authStore'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOverview } from '../../api/adminAnalytics'
import {
  listUsers,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  changeUserRole,
} from '../../api/adminUsers'
import { listItems, approveItem, rejectItem } from '../../api/adminItems'
import {
  listTransactions,
  approveDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
} from '../../api/adminTransactions'
import {
  listSessions,
  createSession,
  activateSession,
  pauseSession,
  resumeSession,
  stopSession,
} from '../../api/adminSessions'

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState('users')
  const [overview, setOverview] = useState(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [overviewError, setOverviewError] = useState(null)

  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [sessions, setSessions] = useState([])
  const [adminError, setAdminError] = useState(null)
  const [isLoadingTabData, setIsLoadingTabData] = useState(false)

  const [rejectReasonByItem, setRejectReasonByItem] = useState({})
  const [sessionForm, setSessionForm] = useState({ title: '', type: 'ENGLISH', startTime: '' })

  useEffect(() => {
    // Load top-level admin overview cards.
    const fetchOverview = async () => {
      setIsLoadingOverview(true)
      setOverviewError(null)

      try {
        const response = await getOverview()
        setOverview(response?.data?.data || null)
      } catch (error) {
        console.error('[AdminDashboard] Failed to load admin overview', error)
        setOverviewError(error?.response?.data?.message || 'Khong tai duoc so lieu tong quan.')
      } finally {
        setIsLoadingOverview(false)
      }
    }

    fetchOverview()
  }, [])

  const loadUsers = async () => {
    const response = await listUsers({}, 0, 20)
    setUsers(response?.data?.data?.content || [])
  }

  const loadItems = async () => {
    const response = await listItems({ status: 'PENDING' }, 0, 20)
    setItems(response?.data?.data?.content || [])
  }

  const loadTransactions = async () => {
    const response = await listTransactions({ status: 'PENDING' }, 0, 20)
    setTransactions(response?.data?.data?.content || [])
  }

  const loadSessions = async () => {
    const response = await listSessions({}, 0, 20)
    setSessions(response?.data?.data?.content || [])
  }

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
      setAdminError(error?.response?.data?.message || 'Khong tai duoc du lieu admin.')
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

  const runAdminAction = async (fn) => {
    setAdminError(null)
    try {
      await fn()
      await loadTabData()
      await (async () => {
        const response = await getOverview()
        setOverview(response?.data?.data || null)
      })()
    } catch (error) {
      const statusCode = error?.response?.status
      if (statusCode === 409) {
        console.warn('[AdminDashboard] Admin action conflict', error?.response?.data)
        setAdminError(error?.response?.data?.message || 'Trang thai hien tai khong cho phep thao tac nay.')
        return
      }
      console.error('[AdminDashboard] Admin action failed', error)
      setAdminError(error?.response?.data?.message || 'Thao tac admin that bai.')
    }
  }

  const renderTabContent = () => {
    if (isLoadingTabData) {
      return <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">Dang tai du lieu...</div>
    }

    if (tab === 'users') {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quan ly users</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="border border-gray-200 rounded p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{u.nickname || u.email}</p>
                  <p className="text-sm text-gray-600">{u.email} | role: {u.role}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => runAdminAction(() => changeUserRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN'))} className="px-2 py-1 text-sm rounded bg-indigo-600 text-white">Toggle role</button>
                  <button onClick={() => runAdminAction(() => muteUser(u.id))} className="px-2 py-1 text-sm rounded bg-amber-600 text-white">Mute</button>
                  <button onClick={() => runAdminAction(() => unmuteUser(u.id))} className="px-2 py-1 text-sm rounded bg-amber-500 text-white">Unmute</button>
                  <button onClick={() => runAdminAction(() => banUser(u.id))} className="px-2 py-1 text-sm rounded bg-red-600 text-white">Ban</button>
                  <button onClick={() => runAdminAction(() => unbanUser(u.id))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Unban</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-gray-600">Khong co user nao.</p>}
          </div>
        </div>
      )
    }

    if (tab === 'items') {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Duyet vat pham</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded p-4">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600 mt-1">{item.description || 'Khong co mo ta.'}</p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button onClick={() => runAdminAction(() => approveItem(item.id, { rarity: item.rarity || 'COMMON', tags: item.tags || [] }))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Approve</button>
                  <input
                    value={rejectReasonByItem[item.id] || ''}
                    onChange={(e) => setRejectReasonByItem((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Ly do reject"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => runAdminAction(() => rejectItem(item.id, { reason: rejectReasonByItem[item.id] || 'Khong dat tieu chuan duyet.' }))}
                    className="px-2 py-1 text-sm rounded bg-red-600 text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-gray-600">Khong co item pending.</p>}
          </div>
        </div>
      )
    }

    if (tab === 'transactions') {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Duyet giao dich pending</h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="border border-gray-200 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{tx.type} - {formatVnd(tx.amount)}</p>
                  <p className="text-sm text-gray-600">{tx.status}</p>
                </div>
                <div className="flex gap-2">
                  {tx.type === 'DEPOSIT' ? (
                    <>
                      <button onClick={() => runAdminAction(() => approveDeposit(tx.id))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Approve</button>
                      <button onClick={() => runAdminAction(() => rejectDeposit(tx.id))} className="px-2 py-1 text-sm rounded bg-red-600 text-white">Reject</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => runAdminAction(() => approveWithdraw(tx.id))} className="px-2 py-1 text-sm rounded bg-emerald-600 text-white">Approve</button>
                      <button onClick={() => runAdminAction(() => rejectWithdraw(tx.id))} className="px-2 py-1 text-sm rounded bg-red-600 text-white">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-gray-600">Khong co giao dich pending.</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quan ly sessions</h2>

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
          <input value={sessionForm.title} onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Session title" className="px-3 py-2 border border-gray-300 rounded" required />
          <select value={sessionForm.type} onChange={(e) => setSessionForm((prev) => ({ ...prev, type: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded">
            <option value="ENGLISH">ENGLISH</option>
            <option value="DUTCH">DUTCH</option>
            <option value="SEALED">SEALED</option>
          </select>
          <input type="datetime-local" value={sessionForm.startTime} onChange={(e) => setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded" required />
          <button className="px-3 py-2 rounded bg-blue-600 text-white">Create</button>
        </form>

        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-600">{s.type} | {s.status}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runAdminAction(() => activateSession(s.id))}
                  disabled={s.status !== 'SCHEDULED'}
                  className="px-2 py-1 text-sm rounded bg-emerald-600 text-white disabled:opacity-50"
                >
                  Start
                </button>
                <button
                  onClick={() => runAdminAction(() => pauseSession(s.id))}
                  disabled={s.status !== 'ACTIVE'}
                  className="px-2 py-1 text-sm rounded bg-amber-600 text-white disabled:opacity-50"
                >
                  Pause
                </button>
                <button
                  onClick={() => runAdminAction(() => resumeSession(s.id))}
                  disabled={s.status !== 'PAUSED'}
                  className="px-2 py-1 text-sm rounded bg-indigo-600 text-white disabled:opacity-50"
                >
                  Resume
                </button>
                <button
                  onClick={() => runAdminAction(() => stopSession(s.id))}
                  disabled={s.status === 'COMPLETED' || s.status === 'CANCELLED'}
                  className="px-2 py-1 text-sm rounded bg-red-600 text-white disabled:opacity-50"
                >
                  Stop
                </button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-gray-600">Khong co session nao.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link to="/" className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200">
              Ve trang chu
            </Link>
            <span className="text-gray-700">Hello, {user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
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
            <h2 className="text-xl font-semibold">Total Users</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.totalUsers ?? '-')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Pending Items</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.totalItems ?? '-')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Revenue</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : formatVnd(overview?.totalRevenue)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Pending Deposits</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.pendingDeposits ?? '-')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Pending Withdrawals</h2>
            <p className="text-3xl mt-2">{isLoadingOverview ? '...' : (overview?.pendingWithdrawals ?? '-')}</p>
          </div>
        </div>
        <div className="mt-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setTab('users')} className={`px-3 py-2 rounded text-sm ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Users</button>
            <button onClick={() => setTab('items')} className={`px-3 py-2 rounded text-sm ${tab === 'items' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Items</button>
            <button onClick={() => setTab('transactions')} className={`px-3 py-2 rounded text-sm ${tab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Transactions</button>
            <button onClick={() => setTab('sessions')} className={`px-3 py-2 rounded text-sm ${tab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>Sessions</button>
          </div>

          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}