import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { submitItem } from '../api/items'
import { uploadFileToSupabase } from '../lib/supabase'

const RARITY_OPTIONS = ['COMMON', 'RARE', 'LEGENDARY']

export default function ItemSubmitPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    rarity: 'COMMON',
  })
  
  // Chứa danh sách URL đã upload lên Supabase
  const [uploadedUrls, setUploadedUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // --- XỬ LÝ UPLOAD ẢNH NHIỀU FILE VỚI KÉO THẢ ---
  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (validFiles.length === 0) {
      setError('Vui lòng chỉ chọn các file hình ảnh.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const uploadPromises = validFiles.map(file => uploadFileToSupabase('items', file))
      const urls = await Promise.all(uploadPromises)
      setUploadedUrls(prev => [...prev, ...urls])
    } catch {
      setError('Lỗi khi tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeImage = (indexToRemove) => {
    setUploadedUrls(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }
  // ----------------------------------------------

  const onSubmit = async (event) => {
    event.preventDefault()
    if (uploadedUrls.length === 0) {
      setError('Vui lòng tải lên ít nhất 1 hình ảnh vật phẩm.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await submitItem({
        name: form.name,
        description: form.description,
        rarity: form.rarity,
        imageUrls: uploadedUrls, // Truyền thẳng mảng URL thay vì text area
      })

      setSuccess('Gửi ký gửi thành công, vui lòng chờ quản trị viên duyệt.')
      setTimeout(() => navigate('/me/inventory'), 1500)
    } catch (err) {
      console.error('[ItemSubmitPage] Failed to submit item', err)
      setError(err?.response?.data?.message || 'Ký gửi vật phẩm thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ký gửi vật phẩm</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Về trang chủ</Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700">{success}</div>}

        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên vật phẩm <span className="text-red-500">*</span></label>
            <input id="name" name="name" value={form.name} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea id="description" name="description" value={form.description} onChange={onChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="rarity" className="block text-sm font-medium text-gray-700 mb-1">Độ hiếm</label>
            <select id="rarity" name="rarity" value={form.rarity} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              {RARITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* VÙNG KÉO THẢ MULTIPLE IMAGES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh vật phẩm (ít nhất 1 ảnh) <span className="text-red-500">*</span></label>
            
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current.click()}
              className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="space-y-2 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative font-medium text-blue-600 hover:text-blue-500">
                    {uploading ? 'Đang tải lên...' : 'Bấm để chọn file'}
                  </span>
                  <p className="pl-1">hoặc kéo thả nhiều ảnh vào đây</p>
                </div>
                <p className="text-xs text-gray-500">Hỗ trợ PNG, JPG, JPEG</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            
            {/* Hiển thị list ảnh đã up */}
            {uploadedUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedUrls.map((url, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-square">
                    <img src={url} alt={`upload-${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => removeImage(index)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={saving || uploading} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition shadow-md">
              {saving ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu ký gửi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}