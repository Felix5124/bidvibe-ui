import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getItemDetail } from "../api/items";
import PageHeaderFrame from "../components/PageHeaderFrame";
import { formatRarity } from "../utils/rarity";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const productImages = useMemo(() => {
    const urls = item?.imageUrls || (item?.imageUrl ? [item.imageUrl] : []);
    return Array.isArray(urls) ? urls.filter(Boolean) : [];
  }, [item]);

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemRes = await getItemDetail(id);
        setItem(readApiData(itemRes));
      } catch (err) {
        console.error("[ItemDetailPage] Failed to load item detail", err);
        setError(
          err?.response?.data?.message || "Không tải được chi tiet vat pham.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadItem();
    }
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  const handlePrevImage = () => {
    if (productImages.length < 2) return;
    setActiveImage(
      (prev) => (prev - 1 + productImages.length) % productImages.length,
    );
  };

  const handleNextImage = () => {
    if (productImages.length < 2) return;
    setActiveImage((prev) => (prev + 1) % productImages.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Chi tiết vật phẩm"
          description="Xem đầy đủ thông tin vật phẩm và dữ liệu giá hiện tại."
        />

        {loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            Đang tải du lieu...
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && item && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {item.name}
                </h2>
                <p className="mt-2 text-gray-700">
                  {item.description || "Không có mo ta."}
                </p>
              </div>
              <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </span>
            </div>

            {/* Hình ảnh vật phẩm */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Hình ảnh vật phẩm
              </h3>
              {productImages.length > 0 ? (
                <>
                  <div className="relative overflow-hidden h-130 w-130 rounded-xl border border-gray-200 bg-gray-50 mx-auto">
                    <img
                      src={productImages[activeImage]}
                      alt={item?.name || "Ảnh vật phẩm"}
                      className="h-full w-full object-cover"
                    />

                    {productImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-slate-800 border border-slate-200 shadow hover:bg-white"
                          aria-label="Ảnh trước"
                        >
                          <span className="text-xl leading-none">&#8592;</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-slate-800 border border-slate-200 shadow hover:bg-white"
                          aria-label="Ảnh sau"
                        >
                          <span className="text-xl leading-none">&#8594;</span>
                        </button>
                      </>
                    )}
                  </div>
                  {productImages.length > 1 && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-xs text-slate-600">
                        {activeImage + 1}/{productImages.length}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  Chưa có ảnh cho sản phẩm này.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Thông tin cơ bản
                </h3>
                <p className="text-sm text-gray-700">
                  Phân loại: {formatRarity(item.rarity)}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Trạng thái: {item.status || "-"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Người liên quan
                </h3>
                <p className="text-sm text-gray-700">
                  Seller:{" "}
                  {item.seller?.id ? (
                    <Link
                      to={`/users/${item.seller.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {item.seller.nickname || item.seller.id}
                    </Link>
                  ) : (
                    "-"
                  )}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Owner hien tai:{" "}
                  {item.currentOwner?.id ? (
                    <Link
                      to={`/users/${item.currentOwner.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {item.currentOwner.nickname || item.currentOwner.id}
                    </Link>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Giá vật phẩm</h3>
              <p className="text-sm text-gray-700 mt-1">
                Giá đấu giá cuối cùng:{" "}
                {item?.latestAuction?.finalPrice != null
                  ? `${new Intl.NumberFormat("vi-VN").format(Number(item.latestAuction.finalPrice))} VND`
                  : "-"}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Giá trên chợ đen:{" "}
                {item?.activeListing?.askingPrice != null
                  ? `${new Intl.NumberFormat("vi-VN").format(Number(item.activeListing.askingPrice))} VND`
                  : "(Chưa bán)"}
              </p>
            </div>

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Thẻ</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
