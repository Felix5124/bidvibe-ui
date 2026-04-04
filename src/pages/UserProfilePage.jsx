import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserProfile, getUserRatings } from '../api/users'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

function StarRating({ stars, size = 'sm' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${star <= stars ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function AverageRating({ ratings }) {
  if (!ratings || ratings.length === 0) return null
  
  const avg = ratings.reduce((sum, r) => sum + (r.stars || 0), 0) / ratings.length
  const rounded = Math.round(avg * 10) / 10
  
  return (
    <div className="flex items-center gap-2">
      <StarRating stars={Math.round(avg)} size="md" />
      <span className="text-lg font-semibold text-gray-900">{rounded}</span>
      <span className="text-sm text-gray-500">({ratings.length} đánh giá)</span>
    </div>
  )
}
      import PageHeaderFrame from '../components/PageHeaderFrame'

export default function UserProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [ratingsMeta, setRatingsMeta] = useState(null)
  const [ratingsPage, setRatingsPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
        setError(err?.response?.data?.message || 'Không tải được hồ sơ công khai.')
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
              <PageHeaderFrame
                title="Hồ sơ công khai"
                description="Xem thông tin uy tín và lịch sử đánh giá của người dùng trong cộng đồng."
              />

        {loading && <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải dữ liệu...</div>}

        {!loading && error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && profile && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.nickname || 'User'} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    {(profile.nickname || profile.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900">{profile.nickname || 'Người dùng'}</h2>
                  <p className="text-gray-500 text-sm">{profile.email}</p>
                  
                  <div className="mt-3">
                    <AverageRating ratings={ratings} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Điểm uy tín</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.reputationScore ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="text-lg text-gray-900">{profile.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="text-lg text-gray-900">{profile.address || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">{profile.email || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Đánh giá ({ratingsMeta?.totalElements ?? ratings.length})
              </h3>

              {ratings.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Chưa có đánh giá nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link 
                          to={`/users/${rating.fromUser?.id}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          {rating.fromUser?.avatarUrl ? (
                            <img src={rating.fromUser.avatarUrl} alt={rating.fromUser?.nickname || 'User'} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {(rating.fromUser?.nickname || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {rating.fromUser?.nickname || 'Ẩn danh'}
                          </span>
                        </Link>
                        <StarRating stars={rating.stars} />
                      </div>
                      {rating.itemName && (
                        <div className="flex items-center gap-3 mb-2 py-2 px-3 bg-gray-50 rounded-lg">
                          {rating.itemImageUrl ? (
                            <img src={rating.itemImageUrl} alt={rating.itemName} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Sản phẩm đánh giá</p>
                            <p className="text-sm font-medium text-gray-900">{rating.itemName}</p>
                          </div>
                        </div>
                      )}
                      {rating.comment && (
                        <p className="text-gray-700 mt-2">{rating.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {rating.createdAt ? new Date(rating.createdAt).toLocaleString('vi-VN') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {ratingsMeta && ratingsMeta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Trang {(ratingsMeta.page || 0) + 1} / {Math.max(ratingsMeta.totalPages || 1, 1)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRatingsPage((p) => Math.max(0, p - 1))}
                      disabled={ratingsPage === 0}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatingsPage((p) => ((ratingsMeta.totalPages || 1) > p + 1 ? p + 1 : p))}
                      disabled={(ratingsMeta.totalPages || 1) <= ratingsPage + 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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