import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSession } from "../api/sessions";
import { getAuctionsBySession } from "../api/auctions";
import { getWatchlist, toggleWatchlist } from "../api/users";
import PageHeaderFrame from "../components/PageHeaderFrame";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

const STATUS_META = {
  SCHEDULED: {
    label: "Đã lên lịch",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  ACTIVE: {
    label: "Đang diễn ra",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  WAITING: {
    label: "Chờ đến lượt",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ENDED: {
    label: "Đã đấu giá xong",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  PAUSED: {
    label: "Tạm đóng",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  COMPLETED: {
    label: "Đã kết thúc",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

const TYPE_LABEL = {
  ENGLISH: "Đấu giá tăng dần",
  DUTCH: "Đấu giá giảm dần",
  SEALED: "Đấu giá kín",
};

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [watchingIds, setWatchingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionRes, auctionsRes] = await Promise.all([
        getSession(id),
        getAuctionsBySession(id),
      ]);
      setSession(readApiData(sessionRes));
      setAuctions(readApiData(auctionsRes) || []);
    } catch (err) {
      console.error("[SessionDetailPage] Failed to load session detail", err);
      setError(
        err?.response?.data?.message || "Không tải được chi tiết phiên đấu giá",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadWatchlist = useCallback(async () => {
    try {
      const response = await getWatchlist(0, 500);
      const payload = readApiData(response);
      const items = Array.isArray(payload?.content) ? payload.content : [];
      setWatchingIds(new Set(items.map((item) => item.id)));
    } catch {
      setWatchingIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadData();
      loadWatchlist();
    }
  }, [id, loadData, loadWatchlist]);

  const handleToggleWatch = async (itemId) => {
    try {
      await toggleWatchlist(itemId);
      setWatchingIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể cập nhật theo dõi vật phẩm.",
      );
    }
  };

  const formatVnd = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + " VND";
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
  };

  const getStatusMeta = (status) =>
    STATUS_META[status] || {
      label: status || "-",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };
  const getTypeLabel = (type) => TYPE_LABEL[type] || type || "-";
  const activeAuctionId = auctions.find(
    (auction) => auction.status === "ACTIVE",
  )?.id;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Chi tiết phiên đấu giá"
          description="Theo dõi trong phiên để biết rõ các sản phẩm đang được đấu giá."
          actions={
            <div className="flex gap-2">
              <Link
                to={`/sessions/${id}/room`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors font-medium"
              >
                Vào phòng đấu giá của phiên
              </Link>
              <Link
                to="/sessions"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors font-medium"
              >
                Về danh sách phiên
              </Link>
            </div>
          }
        />

        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-600">
            Đang tải dữ liệu...
          </div>
        )}
        {!loading && error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && session && (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {session.title}
                </h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full border w-fit ${getStatusMeta(session.status).className}`}
                >
                  {getStatusMeta(session.status).label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5 text-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-slate-500">Loại phiên</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {getTypeLabel(session.type)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-slate-500">Trạng thái</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {getStatusMeta(session.status).label}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-slate-500">Bắt đầu</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {formatDateTime(session.startTime)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-slate-500">Số sản phẩm đấu giá</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {auctions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Danh sách phòng đấu giá
              </h3>

              {auctions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-slate-600">
                  Phiên này chưa có phòng đấu giá nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {auctions.map((auction) => (
                    <div
                      key={auction.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {auction.item?.name || "V?t ph?m chua d?t t�n"}
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            Trạng thái: {getStatusMeta(auction.status).label}
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            Giá hiện tại: {formatVnd(auction.currentPrice)}
                          </p>
                          {auction.id === activeAuctionId && (
                            <p className="text-xs mt-2 inline-flex px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Vật phẩm đang được đấu giá hiện tại
                            </p>
                          )}
                          {(auction.status === "WAITING" ||
                            auction.status === "SCHEDULED") && (
                            <p className="text-xs mt-2 inline-flex px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
                              Chưa tới lượt đấu giá
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            Người dùng chỉ vào một phòng của phiên, hệ thống sẽ
                            tự chuyển vật phẩm theo thứ tự.
                          </p>
                        </div>
                        {(auction.status === "WAITING" ||
                          auction.status === "SCHEDULED") &&
                          auction.item?.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleWatch(auction.item.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${
                                watchingIds.has(auction.item.id)
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-white text-slate-700 border-slate-300"
                              }`}
                            >
                              {watchingIds.has(auction.item.id)
                                ? "Đã theo dõi"
                                : "Theo dõi"}
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
