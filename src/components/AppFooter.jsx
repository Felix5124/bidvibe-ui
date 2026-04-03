export default function AppFooter() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold">BidVibe</h2>
            <p className="text-gray-400 mt-2">Sàn đấu giá vật phẩm trực tuyến</p>
          </div>
          <div className="text-gray-400 text-sm">
            <p>© 2026 BidVibe. Tất cả quyền được bảo lưu.</p>
            <p className="mt-1">Liên hệ: support@bidvibe.com</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
