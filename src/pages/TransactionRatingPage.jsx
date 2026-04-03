import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createRating } from '../api/ratings'
import { useToast } from '../context/ToastContext'
import PageHeaderFrame from '../components/PageHeaderFrame'

export default function TransactionRatingPage() {
  const [searchParams] = useSearchParams()
  const toast = useToast()
  
  const [form, setForm] = useState({
    toUserName: '',
    auctionId: '',
    marketListingId: '',
    stars: 5,
    comment: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Pre-fill form from URL params - only transaction IDs, not user IDs
  useEffect(() => {
    const auctionId = searchParams.get('auctionId')
    const marketListingId = searchParams.get('marketListingId')
    const toUserName = searchParams.get('toUserName') || ''
    
    setForm(prev => ({
      ...prev,
      toUserName,
      auctionId: auctionId || '',
      marketListingId: marketListingId || '',
    }))
  }, [searchParams])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await createRating({
        auctionId: form.auctionId.trim() || null,
        marketListingId: form.marketListingId.trim() || null,
        stars: Number(form.stars),
        comment: form.comment.trim() || null,
      })
      setSuccess('Gửi đánh giá thành công!')
      toast.success('Đánh giá đã được gửi')
    } catch (err) {
      console.error('[TransactionRatingPage] Failed to create rating', err)
      setError(err?.response?.data?.message || 'Tạo đánh giá thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Đánh giá giao dịch"
          description="Chia sẻ trải nghiệm để xây dựng độ tin cậy cho cộng đồng BidVibe."
          actions={<Link to="/" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors font-medium">Về trang chủ</Link>}
        />

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700">{success}</div>}

        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          {form.toUserName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Bạn đang đánh giá: <span className="font-semibold">{form.toUserName}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá sao</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, stars: star }))}
                  className={`p-2 rounded-lg transition-colors ${form.stars >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {form.stars === 1 && 'Rất không hài lòng'}
              {form.stars === 2 && 'Không hài lòng'}
              {form.stars === 3 && 'Bình thường'}
              {form.stars === 4 && 'Hài lòng'}
              {form.stars === 5 && 'Rất hài lòng'}
            </p>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Nhận xét (tùy chọn)</label>
            <textarea 
              id="comment" 
              name="comment" 
              rows={4} 
              value={form.comment} 
              onChange={onChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={saving || (!form.auctionId && !form.marketListingId)} 
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
            <Link 
              to="/" 
              className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}