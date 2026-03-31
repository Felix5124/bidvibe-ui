import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createRating } from '../api/ratings'

export default function TransactionRatingPage() {
  const { id } = useParams()
  const [form, setForm] = useState({
    toUserId: '',
    auctionId: '',
    marketListingId: '',
    stars: 5,
    comment: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Submit post-transaction rating to target user.
  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await createRating({
        toUserId: form.toUserId.trim(),
        auctionId: form.auctionId.trim() || null,
        marketListingId: form.marketListingId.trim() || null,
        stars: Number(form.stars),
        comment: form.comment,
      })
      setSuccess('Gui danh gia thanh cong.')
    } catch (err) {
      console.error('[TransactionRatingPage] Failed to create rating', err)
      setError(err?.response?.data?.message || 'Tao danh gia that bai.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tao danh gia giao dich</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Ve trang chu</Link>
        </div>

        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
          Transaction ID tu route: <span className="font-semibold">{id}</span>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700">{success}</div>}

        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="toUserId" className="block text-sm font-medium text-gray-700 mb-1">To user ID</label>
            <input id="toUserId" name="toUserId" value={form.toUserId} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="auctionId" className="block text-sm font-medium text-gray-700 mb-1">Auction ID (neu co)</label>
              <input id="auctionId" name="auctionId" value={form.auctionId} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <div>
              <label htmlFor="marketListingId" className="block text-sm font-medium text-gray-700 mb-1">Market listing ID (neu co)</label>
              <input id="marketListingId" name="marketListingId" value={form.marketListingId} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
          </div>

          <div>
            <label htmlFor="stars" className="block text-sm font-medium text-gray-700 mb-1">So sao</label>
            <select id="stars" name="stars" value={form.stars} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded">
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Nhan xet</label>
            <textarea id="comment" name="comment" rows={4} value={form.comment} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>

          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Dang gui...' : 'Gui danh gia'}
          </button>
        </form>
      </div>
    </div>
  )
}
