import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchListings } from "../api/market";
import { MarketListingsSkeleton } from "../components/Skeleton";
import PageHeaderFrame from '../components/PageHeaderFrame'
import { RARITY_OPTIONS, formatRarity } from '../utils/rarity'

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

export default function MarketPage() {
  const [filters, setFilters] = useState({ keyword: "", rarity: "" });
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load market listings by page and filters.
  const loadListings = useCallback(
    async (targetPage, targetFilters) => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchListings(targetFilters, targetPage, size);
        const payload = readApiData(response);
        setListings(payload?.content || []);
        setMeta(
          payload
            ? {
                page: payload.page ?? 0,
                totalPages: payload.totalPages ?? 0,
                totalElements: payload.totalElements ?? 0,
              }
            : null,
        );
      } catch (err) {
        console.error("[MarketPage] Failed to load listings", err);
        setError(
          err?.response?.data?.message || "Không tải được danh sach cho den.",
        );
      } finally {
        setLoading(false);
      }
    },
    [size],
  );

  useEffect(() => {
    loadListings(page, filters);
  }, [filters, loadListings, page]);

  // Trigger search with current filter values.
  const onSearch = (event) => {
    event.preventDefault();
    setPage(0);
    loadListings(0, filters);
  };

  const formatVnd = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + " VND";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Chợ đen"
          description="Khám phá các tin đăng cộng đồng và mua vật phẩm trực tiếp với mức giá phù hợp."
        />

        <form
          onSubmit={onSearch}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value }))
            }
            placeholder="Tìm theo tên vật phẩm"
            className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2"
          />
          <select
            value={filters.rarity}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, rarity: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tất cả phân loại</option>
            {RARITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatRarity(option)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Tìm
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <MarketListingsSkeleton count={size} />
        ) : listings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            Không có listing nao.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/market/${listing.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {listing.item?.name || "Vật phẩm chưa đặt tên"}
                  </h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {listing.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {listing.item?.description || "Không có mo ta."}
                </p>
                <div className="mt-3 text-sm text-gray-700">
                  Người bán: {listing.seller?.nickname || "-"}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Phân loại: {formatRarity(listing.item?.rarity)}
                </div>
                <div className="mt-3 text-xl font-bold text-emerald-700">
                  {formatVnd(listing.askingPrice)}
                </div>
              </Link>
            ))}
          </div>
        )}

        {meta && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Trang {meta.page + 1} / {Math.max(meta.totalPages, 1)} -{" "}
              {meta.totalElements} listing
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
              >
               Trước
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => (meta.totalPages > p + 1 ? p + 1 : p))
                }
                disabled={meta.totalPages <= page + 1}
                className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
