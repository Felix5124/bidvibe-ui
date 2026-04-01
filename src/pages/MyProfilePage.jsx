import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/users'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function MyProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const [form, setForm] = useState({
    nickname: '',
    avatarUrl: '',
    phone: '',
    address: '',
  })

  const createdAtText = useMemo(() => {
    if (!profile?.createdAt) return '-'
    return new Date(profile.createdAt).toLocaleString('vi-VN')
  }, [profile])

  useEffect(() => {
    // Load current user profile and populate editable form fields.
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getMyProfile()
        const data = readApiData(response)
        setProfile(data)
        setForm({
          nickname: data?.nickname || '',
          avatarUrl: data?.avatarUrl || '',
          phone: data?.phone || '',
          address: data?.address || '',
        })
      } catch (err) {
        console.error('[MyProfilePage] Failed to load profile', err)
        setError(err?.response?.data?.message || 'Không tải được profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Submit profile updates to backend.
  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await updateMyProfile(form)
      const data = readApiData(response)
      setProfile(data)
      setMessage('Cap nhat profile thanh cong.')
    } catch (err) {
      console.error('[MyProfilePage] Failed to update profile', err)
      setError(err?.response?.data?.message || 'Cap nhat profile thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ của tôi</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ
          </Link>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
            )}
            {message && (
              <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700">{message}</div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Thông tin tài khoản</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <p>Email: {profile?.email || '-'}</p>
                <p>Vai trò: {profile?.role || '-'}</p>
                <p>Uy tin: {profile?.reputationScore ?? '-'}</p>
                <p>Ngày tạo: {createdAtText}</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Cập nhật hồ sơ</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nickname">
                  Nickname
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  value={form.nickname}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="avatarUrl">
                  Avatar URL
                </label>
                <input
                  id="avatarUrl"
                  name="avatarUrl"
                  value={form.avatarUrl}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                  So dien thoai
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
                  Địa chỉ
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
