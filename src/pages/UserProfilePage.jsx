import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserProfile, getUserRatings } from '../api/users'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function UserProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [ratingsMeta, setRatingsMeta] = useState(null)
  const [ratingsPage, setRatingsPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load public profile plus paginated ratings for selected user.
    const loadProfileAndRatings = async () => {
      setLoading(true)
      setError(null)

      try {
        const [profileRes, ratingsRes] = await Promise.all([
          getUserProfile(id),
          getUserRatings(id, ratingsPage, 10),
        ])

        const profileData = readApiData(profileRes)
        const ratingsPayload = readApiData(ratingsRes)

        setProfile(profileData)
        setRatings(ratingsPayload?.content || [])
        setRatingsMeta(ratingsPayload?.meta || null)
      } catch (err) {
        console.error('[UserProfilePage] Failed to load public profile/ratings', err)
        setError(err?.response?.data?.message || 'Không tải được profile cong khai.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadProfileAndRatings()
    }
  }, [id, ratingsPage])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ công khai</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ
          </Link>
        </div>

        {loading && <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>}

        {!loading && error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && profile && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{profile.nickname || profile.email}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-700">
                <p>Email: {profile.email || '-'}</p>
                <p>Uy tin: {profile.reputationScore ?? '-'}</p>
                <p>So dien thoai: {profile.phone || '-'}</p>
                <p>Địa chỉ: {profile.address || '-'}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Đánh giá ({ratingsMeta?.totalElements ?? ratings.length})</h3>

              {ratings.length === 0 ? (
                <p className="text-gray-600">Chưa có danh gia nao.</p>
              ) : (
                <div className="space-y-3">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">Tu: {rating.fromUser?.nickname || 'An danh'}</p>
                        <p className="text-sm text-yellow-600">{rating.stars}/5</p>
                      </div>
                      <p className="text-gray-700 mt-2">{rating.comment || 'Không có binh luan.'}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {rating.createdAt ? new Date(rating.createdAt).toLocaleString('vi-VN') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {ratingsMeta && (
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Trang {ratingsMeta.page + 1} / {Math.max(ratingsMeta.totalPages, 1)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRatingsPage((p) => Math.max(0, p - 1))}
                      disabled={ratingsPage === 0}
                      className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
                    >
                      Truoc
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatingsPage((p) => (ratingsMeta.totalPages > p + 1 ? p + 1 : p))}
                      disabled={ratingsMeta.totalPages <= ratingsPage + 1}
                      className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
                    >
                      Sau
                    </button>
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
