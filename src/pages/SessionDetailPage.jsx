import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSession } from "../api/sessions";
import { getAuctionsBySession } from "../api/auctions";
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

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Chi tiết phiên đấu giá"
          description="Theo dõi trong phiên để biết rõ các sản phẩm đang được đấu giá."
          actions={
            <Link
              to="/sessions"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors font-medium"
            >
              Về danh sách phiên
            </Link>
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
                  <p className="text-slate-500">Số phòng đấu giá</p>
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
                      className="border border-gray-200 rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                    >
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
                      </div>
                      <Link
                        to={`/auctions/${auction.id}`}
                        className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm text-center"
                      >
                        Vào phòng đấu giá
                      </Link>
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
