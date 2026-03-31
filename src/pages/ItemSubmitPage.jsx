import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { submitItem } from '../api/items'

const RARITY_OPTIONS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']

export default function ItemSubmitPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    rarity: 'COMMON',
    imageUrls: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Submit item consignment request with parsed image URL list.
  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const imageUrls = form.imageUrls
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)

      await submitItem({
        name: form.name,
        description: form.description,
        rarity: form.rarity,
        imageUrls,
      })

      setSuccess('Gui ky gui thanh cong, vui long cho duyet.')
      setTimeout(() => navigate('/me/inventory'), 1200)
    } catch (err) {
      console.error('[ItemSubmitPage] Failed to submit item', err)
      setError(err?.response?.data?.message || 'Ky gui vat pham that bai.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ky gui vat pham</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Ve trang chu</Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700">{success}</div>}

        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Ten vat pham</label>
            <input id="name" name="name" value={form.name} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mo ta</label>
            <textarea id="description" name="description" value={form.description} onChange={onChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label htmlFor="rarity" className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
            <select id="rarity" name="rarity" value={form.rarity} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              {RARITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="imageUrls" className="block text-sm font-medium text-gray-700 mb-1">Image URLs (moi dong 1 URL)</label>
            <textarea
              id="imageUrls"
              name="imageUrls"
              value={form.imageUrls}
              onChange={onChange}
              rows={5}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Dang gui...' : 'Gui ky gui'}
          </button>
        </form>
      </div>
    </div>
  )
}
