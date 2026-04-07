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
import { getMyProfile } from "../api/users";
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
  LOCKED: {
    label: "Đang khóa",
    color: "bg-orange-100 text-orange-800 border-orange-200",
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
  const [activeListingsByItemId, setActiveListingsByItemId] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingTargetItemId, setShippingTargetItemId] = useState(null);
  const [shippingAddressDraft, setShippingAddressDraft] = useState("");
  const [updateProfileAddress, setUpdateProfileAddress] = useState(true);
  const [isLoadingShippingProfile, setIsLoadingShippingProfile] =
    useState(false);
  const [actionMenuItemId, setActionMenuItemId] = useState(null);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [marketModalItemId, setMarketModalItemId] = useState(null);
  const [marketModalMode, setMarketModalMode] = useState("list");
  const [marketPriceDraft, setMarketPriceDraft] = useState("");

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
    setShippingTargetItemId(itemId);
    setIsShippingModalOpen(true);
    setUpdateProfileAddress(true);
    setIsLoadingShippingProfile(true);
    try {
      const response = await getMyProfile();
      const profile = readApiData(response);
      setShippingAddressDraft(profile?.address || "");
    } catch {
      setShippingAddressDraft("");
      toast.warning("Không tải được địa chỉ hồ sơ, hãy nhập thủ công.");
    } finally {
      setIsLoadingShippingProfile(false);
    }
  };

  const handleConfirmShippingRequest = async () => {
    const itemId = shippingTargetItemId;
    const address = String(shippingAddressDraft || "").trim();
    if (!itemId) return;
    if (!address) {
      toast.warning("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    setProcessingId(itemId);
    try {
      await requestShipping(itemId, {
        shippingAddress: address,
        updateProfileAddress,
      });
      toast.success("Đã gửi yêu cầu giao hàng.");
      setIsShippingModalOpen(false);
      setShippingTargetItemId(null);
      setShippingAddressDraft("");
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

  const handleUpdateListingPrice = async (itemId, priceValue) => {
    const listing = activeListingsByItemId[itemId];
    if (!listing?.id) {
      toast.warning("Không tìm thấy tin đăng để cập nhật giá.");
      return;
    }

    const askingPrice = Number(priceValue);
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

  const handleListOnMarket = async (itemId, priceValue) => {
    const askingPrice = Number(priceValue);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      toast.warning("Giá niêm yết phải lớn hơn 0.");
      return;
    }

    setProcessingId(itemId);
    try {
      await createListing({ itemId, askingPrice });
      toast.success("Đã niêm yết vật phẩm lên chợ.");
      await loadInventory(page);
    } catch (err) {
      console.error("[InventoryPage] Failed to list item on market", err);
      toast.error(err?.response?.data?.message || "Niêm yết lên chợ thất bại.");
    } finally {
      setProcessingId(null);
    }
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

  const openMarketModal = (itemId, mode = "list") => {
    const listing = activeListingsByItemId[itemId];
    setMarketModalMode(mode);
    setMarketModalItemId(itemId);
    setMarketPriceDraft(
      mode === "update" && listing?.askingPrice != null
        ? String(listing.askingPrice)
        : "",
    );
    setIsMarketModalOpen(true);
    setActionMenuItemId(null);
  };

  const handleSubmitMarketModal = async () => {
    const itemId = marketModalItemId;
    if (!itemId) return;
    if (marketModalMode === "update") {
      await handleUpdateListingPrice(itemId, marketPriceDraft);
    } else {
      await handleListOnMarket(itemId, marketPriceDraft);
    }
    setIsMarketModalOpen(false);
    setMarketModalItemId(null);
    setMarketPriceDraft("");
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
              const shippingRequest = product?.shippingRequest || null;
              const shippingRequestStatus = shippingRequest?.status || null;
              const isProcessing = processingId === productId;
              const isItemLocked =
                product?.cooldownUntil &&
                new Date(product.cooldownUntil).getTime() > Date.now();
              const displayStatus =
                shippingRequestStatus === "PENDING"
                  ? "SHIPPING_REQUESTED"
                  : shippingRequestStatus === "APPROVED"
                    ? "SHIPPING_IN_PROGRESS"
                    : isItemLocked && productStatus === "IN_INVENTORY"
                      ? "LOCKED"
                      : productStatus;
              const statusInfo = STATUS_MAP[displayStatus] || {
                label: displayStatus,
                color: "bg-gray-100 text-gray-800",
              };

              const isShippingRequested = shippingRequestStatus === "PENDING";
              const isShippingInProgress = shippingRequestStatus === "APPROVED";
              const isShippingRejected = shippingRequestStatus === "REJECTED";
              const isReadyInInventory =
                productStatus === "IN_INVENTORY" &&
                !isShippingRequested &&
                !isShippingInProgress &&
                !isItemLocked;

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
                  className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full border ${
                    isItemLocked
                      ? "bg-red-50/30 border-red-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2
                      className="text-lg font-bold text-gray-900 leading-7 min-h-7 flex-1"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product?.name}
                    </h2>
                    <span
                      title={
                        isItemLocked
                          ? `Vật phẩm sẽ được mở khóa vào ${new Date(product.cooldownUntil).toLocaleString("vi-VN")}`
                          : ""
                      }
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="relative w-full aspect-5/3 mb-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 group">
                    {product?.imageUrls && product.imageUrls.length > 0 ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150" fill="%23f1f5f9"><rect width="200" height="150"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em">Không tải được ảnh</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                        Chưa có ảnh
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>

                  <div className="mb-4 min-h-16 space-y-1 text-sm text-gray-700">
                    <p className="leading-6 min-h-6">
                      Người bán: {product?.seller?.nickname || "-"}
                    </p>
                    <p className="leading-6 min-h-6">
                      Phân loại: {formatRarity(product?.rarity)}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full mt-auto relative">
                    <Link
                      to={productId ? `/items/${productId}` : "/me/inventory"}
                      className="flex-1 text-center py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
                    >
                      Chi tiết sản phẩm
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setActionMenuItemId((prev) =>
                          prev === productId ? null : productId,
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Option
                    </button>

                    {actionMenuItemId === productId && (
                      <div className="absolute right-0 top-12 z-20 w-52 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                        {isReadyInInventory && !hasActiveListing && (
                          <button
                            type="button"
                            onClick={() => openMarketModal(productId, "list")}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            Đăng bán chợ đen
                          </button>
                        )}
                        {isReadyInInventory && !hasActiveListing && (
                          <button
                            type="button"
                            onClick={() => {
                              handleRequestShipping(productId);
                              setActionMenuItemId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            Yêu cầu giao hàng
                          </button>
                        )}
                        {isReadyInInventory && hasActiveListing && (
                          <button
                            type="button"
                            onClick={() => openMarketModal(productId, "update")}
                            disabled={!isPriceUnlocked}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cập nhật giá chợ đen
                          </button>
                        )}
                        {isReadyInInventory &&
                          hasActiveListing &&
                          !isPriceUnlocked && (
                            <p className="px-3 py-2 text-xs text-amber-700 bg-amber-50">
                              Giá bị khóa tới{" "}
                              {new Date(unlockTime).toLocaleString("vi-VN")}
                            </p>
                          )}
                        {isShippingInProgress && (
                          <button
                            type="button"
                            onClick={() => {
                              handleConfirmReceipt(productId);
                              setActionMenuItemId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            Xác nhận đã nhận hàng
                          </button>
                        )}
                        {productStatus === "REJECTED" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteRejected(productId);
                              setActionMenuItemId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Xóa vật phẩm
                          </button>
                        )}
                        {!isReadyInInventory &&
                          !isShippingInProgress &&
                          productStatus !== "REJECTED" && (
                            <p className="px-3 py-2 text-xs text-gray-500">
                              Không có thao tác phù hợp
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  {isShippingRejected && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      Yêu cầu giao hàng bị từ chối.
                      {shippingRequest?.adminNote
                        ? ` Lý do: ${shippingRequest.adminNote}`
                        : ""}
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

        {isShippingModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => {
              setIsShippingModalOpen(false);
              setShippingTargetItemId(null);
            }}
          >
            <div
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Xác minh địa chỉ giao hàng
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Địa chỉ mặc định được lấy từ hồ sơ. Bạn có thể chỉnh trực tiếp
                tại đây trước khi gửi yêu cầu.
              </p>

              <label className="mt-4 block text-sm font-medium text-gray-700">
                Địa chỉ nhận hàng
              </label>
              <textarea
                rows={4}
                value={shippingAddressDraft}
                onChange={(event) =>
                  setShippingAddressDraft(event.target.value)
                }
                disabled={
                  isLoadingShippingProfile ||
                  processingId === shippingTargetItemId
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập địa chỉ nhận hàng chi tiết"
              />

              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={updateProfileAddress}
                  onChange={(event) =>
                    setUpdateProfileAddress(event.target.checked)
                  }
                />
                Cập nhật địa chỉ này vào hồ sơ của tôi
              </label>

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsShippingModalOpen(false);
                    setShippingTargetItemId(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmShippingRequest}
                  disabled={
                    isLoadingShippingProfile ||
                    processingId === shippingTargetItemId
                  }
                  className="px-4 py-2 rounded-lg bg-amber-600 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  Xác nhận yêu cầu gửi
                </button>
              </div>
            </div>
          </div>
        )}

        {isMarketModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => {
              setIsMarketModalOpen(false);
              setMarketModalItemId(null);
            }}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {marketModalMode === "update"
                  ? "Cập nhật giá chợ đen"
                  : "Đăng bán lên chợ đen"}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Nhập giá mong muốn cho vật phẩm.
              </p>
              <input
                type="number"
                min="0"
                value={marketPriceDraft}
                onChange={(event) => setMarketPriceDraft(event.target.value)}
                className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập giá (VND)"
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMarketModalOpen(false);
                    setMarketModalItemId(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmitMarketModal}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
