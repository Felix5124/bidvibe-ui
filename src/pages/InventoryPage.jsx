import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import {
  confirmReceipt,
  deleteRejectedItem,
  getInventory,
  requestShipping,
} from "../api/items";
import {
  createListing,
  getMyActiveListings,
  updateListingPrice,
} from "../api/market";
import { ItemsListSkeleton } from "../components/Skeleton";
import PageHeaderFrame from "../components/PageHeaderFrame";
import { formatRarity } from "../utils/rarity";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

// Map trạng thái để hiển thị tiếng Việt và màu sắc thân thiện
const STATUS_MAP = {
  PENDING: {
    label: "Đang chờ duyệt",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  IN_AUCTION: {
    label: "Đang đấu giá",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  IN_INVENTORY: {
    label: "Trong kho",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  SHIPPING_REQUESTED: {
    label: "Đang chờ xử lý",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  SHIPPING_IN_PROGRESS: {
    label: "Đang giao hàng",
    color: "bg-sky-100 text-sky-800 border-sky-200",
  },
  SHIPPED: {
    label: "Đã giao hàng",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  REJECTED: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

export default function InventoryPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marketPriceById, setMarketPriceById] = useState({});
  const [activeListingsByItemId, setActiveListingsByItemId] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadInventory = useCallback(
    async (targetPage) => {
      setLoading(true);
      setError(null);
      try {
        const [inventoryRes, activeListingsRes] = await Promise.all([
          getInventory(targetPage, size),
          getMyActiveListings(),
        ]);

        const payload = readApiData(inventoryRes);
        const activeListings = readApiData(activeListingsRes) || [];
        const listingMap = {};
        activeListings.forEach((listing) => {
          const itemId = listing?.item?.id;
          if (itemId) listingMap[itemId] = listing;
        });

        setItems(payload?.content || []);
        setMeta(payload?.meta || null);
        setActiveListingsByItemId(listingMap);
      } catch (err) {
        console.error("[InventoryPage] Failed to load inventory", err);
        setError(err?.response?.data?.message || "Không tải được kho đồ.");
      } finally {
        setLoading(false);
      }
    },
    [size],
  );

  useEffect(() => {
    loadInventory(page);
  }, [loadInventory, page]);

  const handleRequestShipping = async (itemId) => {
    setProcessingId(itemId);
    try {
      await requestShipping(itemId);
      toast.success("Đã gửi yêu cầu giao hàng.");
      await loadInventory(page);
    } catch (err) {
      console.error("[InventoryPage] Failed to request shipping", err);
      toast.error(
        err?.response?.data?.message || "Yêu cầu giao hàng thất bại.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReceipt = async (itemId) => {
    setProcessingId(itemId);
    try {
      await confirmReceipt(itemId);
      toast.success("Đã xác nhận nhận hàng.");
      await loadInventory(page);
    } catch (err) {
      console.error("[InventoryPage] Failed to confirm receipt", err);
      toast.error(
        err?.response?.data?.message || "Xác nhận nhận hàng thất bại.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateListingPrice = async (itemId) => {
    const listing = activeListingsByItemId[itemId];
    if (!listing?.id) {
      toast.warning("Không tìm thấy tin đăng để cập nhật giá.");
      return;
    }

    const askingPrice = Number(marketPriceById[itemId]);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      toast.warning("Giá niêm yết phải lớn hơn 0.");
      return;
    }

    setProcessingId(itemId);
    try {
      await updateListingPrice(listing.id, askingPrice);
      toast.success("Đã cập nhật giá tin đăng.");
      await loadInventory(page);
    } catch (err) {
      console.error("[InventoryPage] Failed to update listing price", err);
      toast.error(err?.response?.data?.message || "Cập nhật giá thất bại.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleListOnMarket = async (itemId) => {
    const askingPrice = Number(marketPriceById[itemId]);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      toast.warning("Giá niêm yết phải lớn hơn 0.");
      return;
    }

    setProcessingId(itemId);
    try {
      await createListing({ itemId, askingPrice });
      toast.success("Đã niêm yết vật phẩm lên chợ.");
      setMarketPriceById((prev) => ({ ...prev, [itemId]: "" }));
      await loadInventory(page);
    } catch (err) {
      console.error("[InventoryPage] Failed to list item on market", err);
      toast.error(err?.response?.data?.message || "Niêm yết lên chợ thất bại.");
    } finally {
      setProcessingId(null);
    }
  };

  const setMarketPrice = (itemId, value) => {
    setMarketPriceById((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleDeleteRejected = async (itemId) => {
    const confirmed = window.confirm("Xóa vĩnh viễn vật phẩm bị từ chối này?");
    if (!confirmed) return;

    setProcessingId(itemId);
    try {
      await deleteRejectedItem(itemId);
      toast.success("Đã xóa vật phẩm bị từ chối.");
      await loadInventory(page);
    } catch (err) {
      console.error("[InventoryPage] Failed to delete rejected item", err);
      toast.error(err?.response?.data?.message || "Xóa vật phẩm thất bại.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Quản lý vật phẩm"
          description="Theo dõi đồ bạn ký gửi, đồ đã mua và niêm yết lên chợ đen."
          actions={
            <div className="flex gap-3">
              <Link
                to="/items/submit"
                className="px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 font-medium transition shadow-sm"
              >
                + Ký gửi đồ mới
              </Link>
            </div>
          }
        />

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <ItemsListSkeleton count={size} />
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            Bạn chưa có vật phẩm nào trong kho hoặc đang ký gửi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const product = item?.item || item;
              const productId = product?.id || item?.id;
              const productStatus = product?.status || item?.status;
              const isProcessing = processingId === productId;
              const statusInfo = STATUS_MAP[productStatus] || {
                label: productStatus,
                color: "bg-gray-100 text-gray-800",
              };

              const isReadyInInventory = productStatus === "IN_INVENTORY";
              const isShippingRequested =
                productStatus === "SHIPPING_REQUESTED";
              const isShippingInProgress =
                productStatus === "SHIPPING_IN_PROGRESS";

              const activeListing = productId
                ? activeListingsByItemId[productId]
                : null;
              const hasActiveListing = Boolean(activeListing?.id);
              const unlockTime = activeListing?.createdAt
                ? new Date(activeListing.createdAt).getTime() +
                  12 * 60 * 60 * 1000
                : null;
              const isPriceUnlocked = unlockTime != null && now >= unlockTime;

              return (
                <div
                  key={productId || item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {product?.name}
                    </h2>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {product?.imageUrls && product.imageUrls.length > 0 && (
                    <div className="relative w-full aspect-[5/3] mb-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 group">
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150" fill="%23f1f5f9"><rect width="200" height="150"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em">Không tải được ảnh</text></svg>';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  )}

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {product?.description || "Không có mô tả."}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">
                      Phân loại: {formatRarity(product?.rarity)}
                    </span>
                    {product?.cooldownUntil &&
                      new Date(product.cooldownUntil) > new Date() && (
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md">
                          Khóa đến:{" "}
                          {new Date(product.cooldownUntil).toLocaleString(
                            "vi-VN",
                          )}
                        </span>
                      )}
                  </div>

                  <div className="flex gap-2 w-full mt-auto">
                    <Link
                      to={productId ? `/items/${productId}` : "/me/inventory"}
                      className="flex-1 text-center py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
                    >
                      Chi tiết sản phẩm
                    </Link>

                    {isReadyInInventory && !hasActiveListing && (
                      <button
                        type="button"
                        onClick={() => handleRequestShipping(productId)}
                        disabled={isProcessing || !productId}
                        className="flex-1 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60 transition"
                      >
                        Yêu cầu giao hàng
                      </button>
                    )}

                    {isShippingRequested && (
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200 cursor-not-allowed"
                      >
                        Đang chờ xử lý
                      </button>
                    )}

                    {isShippingInProgress && (
                      <button
                        type="button"
                        onClick={() => handleConfirmReceipt(productId)}
                        disabled={isProcessing || !productId}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
                      >
                        Đã nhận được hàng
                      </button>
                    )}

                    {productStatus === "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRejected(productId)}
                        disabled={isProcessing || !productId}
                        className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-60 transition"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {isReadyInInventory && !hasActiveListing && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="text-xs font-semibold text-gray-700 block mb-2 uppercase tracking-wide">
                        Đăng bán lên Chợ Đen
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={marketPriceById[productId] || ""}
                          onChange={(e) =>
                            setMarketPrice(productId, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Giá bán (VND)"
                        />
                        <button
                          type="button"
                          onClick={() => handleListOnMarket(productId)}
                          disabled={
                            isProcessing ||
                            !productId ||
                            !marketPriceById[productId]
                          }
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          Bán
                        </button>
                      </div>
                    </div>
                  )}

                  {isReadyInInventory && hasActiveListing && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="text-xs font-semibold text-gray-700 block mb-2 uppercase tracking-wide">
                        Tin đăng đang hoạt động
                      </label>
                      <p className="text-sm text-gray-700 mb-2">
                        Giá hiện tại:{" "}
                        <span className="font-semibold text-emerald-700">
                          {Number(activeListing.askingPrice).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          VND
                        </span>
                      </p>
                      {!isPriceUnlocked && unlockTime != null && (
                        <p className="text-xs text-amber-700 mb-2">
                          Giá đang bị khóa sau khi đăng bán. Có thể sửa từ:{" "}
                          {new Date(unlockTime).toLocaleString("vi-VN")}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={marketPriceById[productId] || ""}
                          onChange={(e) =>
                            setMarketPrice(productId, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Giá mới (VND)"
                          disabled={!isPriceUnlocked}
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateListingPrice(productId)}
                          disabled={
                            isProcessing ||
                            !productId ||
                            !marketPriceById[productId] ||
                            !isPriceUnlocked
                          }
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          Cập nhật giá
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
            <p className="text-sm text-gray-600 font-medium">
              Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)} — Tổng số{" "}
              {meta.totalElements} vật phẩm
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition"
              >
                Trang trước
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))
                }
                disabled={loading || meta.totalPages <= page + 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}