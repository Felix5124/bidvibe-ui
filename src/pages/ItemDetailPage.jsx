import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getItemDetail } from '../api/items'
import { getPriceHistory } from '../api/analytics'
import PageHeaderFrame from '../components/PageHeaderFrame'
import { formatRarity } from '../utils/rarity'

const readApiData = (response) => response?.data?.data ?? response?.data ?? null

export default function ItemDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load item info and its price history for analytics tab.
    const loadItem = async () => {
      setLoading(true)
      setError(null)
      try {
        const itemRes = await getItemDetail(id)
        setItem(readApiData(itemRes))

        try {
          const historyRes = await getPriceHistory(id)
          const historyData = readApiData(historyRes)
          setPriceHistory(historyData?.pricePoints || [])
        } catch (historyErr) {
          // Older backend versions may return 404 when item has never joined an auction.
          if (historyErr?.response?.status === 404) {
            setPriceHistory([])
          } else {
            console.warn('[ItemDetailPage] Failed to load price history, fallback to empty list', historyErr)
            setPriceHistory([])
          }
        }
      } catch (err) {
        console.error('[ItemDetailPage] Failed to load item detail/price history', err)
        setError(err?.response?.data?.message || 'Không tải được chi tiet vat pham.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadItem()
    }
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Chi tiết vật phẩm"
          description="Xem thông tin, chủ sở hữu và lịch sử giá của vật phẩm."
        />

        {loading && <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">Đang tải du lieu...</div>}

        {!loading && error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>
        )}

         {!loading && !error && item && (
           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <div className="flex items-start justify-between gap-4">
               <div>
                 <h2 className="text-2xl font-semibold text-gray-900">{item.name}</h2>
                 <p className="mt-2 text-gray-700">{item.description || 'Không có mo ta.'}</p>
               </div>
               <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">{item.status}</span>
             </div>

             {/* Hình ảnh vật phẩm */}
             <div className="mt-6">
               <h3 className="font-semibold text-gray-900 mb-3">Hình ảnh vật phẩm</h3>
               {(() => {
                 const images = item?.imageUrls || (item?.imageUrl ? [item.imageUrl] : []);
                 if (images.length > 0) {
                   return (
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                         {images.map((url, index) => (
                           <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                             <img 
                               src={url} 
                               alt={`${item.name} - ${index + 1}`}
                               className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                               onError={(e) => {
                                 e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="%23f1f5f9"><rect width="100" height="100"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em">Hình ${index + 1}</text></svg>'
                               }}
                             />
                           </div>
                         ))}
                       </div>
                       <p className="text-xs text-slate-500 mt-2 text-center">
                         Tổng cộng: {images.length} hình ảnh
                       </p>
                     </div>
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

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               <div>
                 <h3 className="font-semibold text-gray-900 mb-2">Thông tin cơ bản</h3>
                 <p className="text-sm text-gray-700">Phân loại: {formatRarity(item.rarity)}</p>
                 <p className="text-sm text-gray-700 mt-1">
                   Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}
                 </p>
                 <p className="text-sm text-gray-700 mt-1">
                   Cooldown den: {item.cooldownUntil ? new Date(item.cooldownUntil).toLocaleString('vi-VN') : '-'}
                 </p>
               </div>

               <div>
                 <h3 className="font-semibold text-gray-900 mb-2">Người liên quan</h3>
                 <p className="text-sm text-gray-700">
                   Seller:{' '}
                   {item.seller?.id ? (
                     <Link to={`/users/${item.seller.id}`} className="text-blue-600 hover:text-blue-700">
                       {item.seller.nickname || item.seller.id}
                     </Link>
                   ) : (
                     '-'
                   )}
                 </p>
                 <p className="text-sm text-gray-700 mt-1">
                   Owner hien tai:{' '}
                   {item.currentOwner?.id ? (
                     <Link to={`/users/${item.currentOwner.id}`} className="text-blue-600 hover:text-blue-700">
                       {item.currentOwner.nickname || item.currentOwner.id}
                     </Link>
                   ) : (
                     '-'
                   )}
                 </p>
               </div>
             </div>

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Thẻ</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Lịch sử giá</h3>
              {priceHistory.length === 0 ? (
                <p className="text-sm text-gray-600">Chưa có du lieu lich su gia.</p>
              ) : (
                <div className="space-y-2">
                  {priceHistory.map((point, index) => (
                    <div key={`${point.timestamp}-${index}`} className="border border-gray-200 rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900">{point.eventType || 'EVENT'}</p>
                        <p className="text-xs text-gray-600">
                          {point.timestamp ? new Date(point.timestamp).toLocaleString('vi-VN') : '-'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-700">
                        {new Intl.NumberFormat('vi-VN').format(Number(point.price || 0))} VND
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
