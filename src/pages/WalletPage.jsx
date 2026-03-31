import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBalance, getTransactionHistory, requestDeposit, requestWithdraw } from '../api/wallet'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function WalletPage() {
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [txMeta, setTxMeta] = useState(null)
  const [txPage, setTxPage] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [depositForm, setDepositForm] = useState({ amount: '', note: '' })
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankAccountName: '', bankAccountNumber: '', bankName: '' })

  // Load wallet balance summary.
  const loadWallet = useCallback(async () => {
    const response = await getBalance()
    setBalance(readApiData(response))
  }, [])

  // Load paginated wallet transactions.
  const loadTransactions = useCallback(async (page = 0) => {
    const response = await getTransactionHistory({}, page, 10)
    const payload = readApiData(response)
    setTransactions(payload?.content || [])
    setTxMeta(payload?.meta || null)
  }, [])

  // Load balance + transaction list in a single refresh cycle.
  const loadAll = useCallback(async (page = 0) => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadWallet(), loadTransactions(page)])
    } catch (err) {
      console.error('[WalletPage] Failed to load wallet data', err)
      setError(err?.response?.data?.message || 'Khong tai duoc du lieu vi.')
    } finally {
      setLoading(false)
    }
  }, [loadTransactions, loadWallet])

  useEffect(() => {
    loadAll(txPage)
  }, [loadAll, txPage])

  const formatVnd = (value) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' VND'
  }

  // Submit deposit request.
  const submitDeposit = async (event) => {
    event.preventDefault()
    try {
      await requestDeposit({ amount: Number(depositForm.amount), note: depositForm.note })
      setDepositForm({ amount: '', note: '' })
      await loadAll(txPage)
    } catch (err) {
      console.error('[WalletPage] Failed to request deposit', err)
      setError(err?.response?.data?.message || 'Gui yeu cau nap tien that bai.')
    }
  }

  // Submit withdraw request.
  const submitWithdraw = async (event) => {
    event.preventDefault()
    try {
      await requestWithdraw({
        amount: Number(withdrawForm.amount),
        bankAccountName: withdrawForm.bankAccountName,
        bankAccountNumber: withdrawForm.bankAccountNumber,
        bankName: withdrawForm.bankName,
      })
      setWithdrawForm({ amount: '', bankAccountName: '', bankAccountNumber: '', bankName: '' })
      await loadAll(txPage)
    } catch (err) {
      console.error('[WalletPage] Failed to request withdraw', err)
      setError(err?.response?.data?.message || 'Gui yeu cau rut tien that bai.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Vi tien</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Ve trang chu</Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Dang tai du lieu...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatVnd(balance?.balanceAvailable)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-600">Locked</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{formatVnd(balance?.balanceLocked)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{formatVnd(balance?.totalBalance)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <form onSubmit={submitDeposit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                <h2 className="text-xl font-semibold">Nap tien</h2>
                <input type="number" min="0" required value={depositForm.amount} onChange={(e) => setDepositForm((prev) => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="So tien" />
                <input value={depositForm.note} onChange={(e) => setDepositForm((prev) => ({ ...prev, note: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Ghi chu" />
                <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Gui yeu cau nap</button>
              </form>

              <form onSubmit={submitWithdraw} className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                <h2 className="text-xl font-semibold">Rut tien</h2>
                <input type="number" min="0" required value={withdrawForm.amount} onChange={(e) => setWithdrawForm((prev) => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="So tien" />
                <input required value={withdrawForm.bankAccountName} onChange={(e) => setWithdrawForm((prev) => ({ ...prev, bankAccountName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Ten chu tai khoan" />
                <input required value={withdrawForm.bankAccountNumber} onChange={(e) => setWithdrawForm((prev) => ({ ...prev, bankAccountNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="So tai khoan" />
                <input required value={withdrawForm.bankName} onChange={(e) => setWithdrawForm((prev) => ({ ...prev, bankName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Ten ngan hang" />
                <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Gui yeu cau rut</button>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Lich su giao dich</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-600">Chua co giao dich nao.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="border border-gray-200 rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{tx.type}</p>
                        <p className="text-sm text-gray-600">{tx.description || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700">{formatVnd(tx.amount)}</p>
                        <p className="text-sm text-gray-600">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {txMeta && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Trang {txMeta.page + 1} / {Math.max(txMeta.totalPages, 1)}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTxPage((p) => Math.max(0, p - 1))} disabled={txPage === 0} className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60">Truoc</button>
                    <button type="button" onClick={() => setTxPage((p) => (txMeta.totalPages > p + 1 ? p + 1 : p))} disabled={txMeta.totalPages <= txPage + 1} className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60">Sau</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
