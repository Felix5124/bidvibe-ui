import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
// Thêm hàm getUserRatings vào import
import { getMyProfile, updateMyProfile, getUserRatings } from "../api/users";
import { uploadFileToSupabase } from "../lib/supabase";
import PageHeaderFrame from "../components/PageHeaderFrame";
import { useAuthStore } from "../store/authStore";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

export default function MyProfilePage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // States cho phần hiển thị Modal Đánh Giá
  const [isRatingsModalOpen, setIsRatingsModalOpen] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [ratingsMeta, setRatingsMeta] = useState(null);
  const [ratingsPage, setRatingsPage] = useState(0);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);

  const [form, setForm] = useState({
    nickname: "",
    avatarUrl: "",
    phone: "",
    address: "",
  });

  const displayAvatar =
    form.avatarUrl ||
    profile?.avatarUrl ||
    user?.googleAvatar ||
    "https://ui-avatars.com/api/?name=User&background=random";

  const createdAtText = useMemo(() => {
    if (!profile?.createdAt) return "-";
    return new Date(profile.createdAt).toLocaleString("vi-VN");
  }, [profile]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMyProfile();
        const data = readApiData(response);
        setProfile(data);
        setForm({
          nickname: data?.nickname || "",
          avatarUrl: data?.avatarUrl || "",
          phone: data?.phone || "",
          address: data?.address || "",
        });
      } catch (err) {
        console.error("[MyProfilePage] Failed to load profile", err);
        setError(err?.response?.data?.message || "Không tải được profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Gọi API lấy danh sách đánh giá khi mở Modal hoặc chuyển trang
  useEffect(() => {
    if (isRatingsModalOpen && user?.id) {
      const fetchRatings = async () => {
        setIsLoadingRatings(true);
        try {
          const response = await getUserRatings(user.id, ratingsPage, 10);
          const payload = readApiData(response);
          setRatings(payload?.content || []);
          setRatingsMeta(payload?.meta || null);
        } catch (err) {
          console.error(err);
          toast.error("Không thể tải danh sách đánh giá.");
        } finally {
          setIsLoadingRatings(false);
        }
      };
      fetchRatings();
    }
  }, [isRatingsModalOpen, ratingsPage, user?.id]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFileToSupabase("avatars", file);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
      toast.success("Đã tải lên ảnh avatar.");
    } catch {
      toast.error("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await updateMyProfile(form);
      const data = readApiData(response);
      setProfile(data);
      toast.success("Cập nhật profile thành công.");
    } catch (err) {
      console.error("[MyProfilePage] Failed to update profile", err);
      setError(err?.response?.data?.message || "Cập nhật profile thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Hồ sơ của tôi"
          description="Quản lý thông tin cá nhân, ảnh đại diện và mức độ uy tín tài khoản."
        />

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-6">
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-md"
                onError={(e) => {
                  e.target.src =
                    "https://ui-avatars.com/api/?name=User&background=random";
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 flex-1 w-full">
                <p>
                  Email:{" "}
                  <span className="font-semibold text-gray-900">
                    {profile?.email || "-"}
                  </span>
                </p>
                <p>
                  Vai trò:{" "}
                  <span className="font-semibold text-gray-900">
                    {profile?.role || "-"}
                  </span>
                </p>
                
                {/* NÚT XEM ĐÁNH GIÁ ĐƯỢC THÊM VÀO ĐÂY */}
                <div className="flex items-center gap-2">
                  <p>Uy tín:</p>
                  <span className="font-semibold text-yellow-600">
                    {profile?.reputationScore ?? "-"} ⭐
                  </span>
                  <button
                    onClick={() => setIsRatingsModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-none p-0"
                  >
                    (Xem chi tiết)
                  </button>
                </div>

                <p>
                  Ngày tạo:{" "}
                  <span className="font-semibold text-gray-900">
                    {createdAtText}
                  </span>
                </p>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Cập nhật hồ sơ
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh đại diện (Avatar)
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current.click()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative font-medium text-blue-600 hover:text-blue-500">
                        {uploading ? "Đang tải lên..." : "Tải file lên"}
                      </span>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF lên đến 5MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="nickname"
                >
                  Nickname
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  value={form.nickname}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="phone"
                >
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="address"
                >
                  Địa chỉ
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving || uploading}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* MODAL HIỂN THỊ DANH SÁCH ĐÁNH GIÁ */}
      {isRatingsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn" 
          onClick={() => setIsRatingsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                Đánh giá từ cộng đồng
                <span className="ml-3 text-sm font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Uy tín: {profile?.reputationScore ?? "-"} ⭐
                </span>
              </h3>
              <button 
                onClick={() => setIsRatingsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
              {isLoadingRatings ? (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                   Đang tải đánh giá...
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Bạn chưa nhận được đánh giá nào.</p>
                  <p className="text-gray-400 text-sm mt-1">Hoàn tất giao dịch để nhận được đánh giá từ người khác nhé!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Link to={`/users/${r.fromUser?.id}`} className="hover:opacity-80 transition-opacity cursor-pointer">
                            {r.fromUser?.avatarUrl ? (
                              <img src={r.fromUser.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100"/>
                            ) : (
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                                {(r.fromUser?.nickname || '?')[0].toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link to={`/users/${r.fromUser?.id}`} className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors">
                              {r.fromUser?.nickname || 'Ẩn danh'}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                           {[1,2,3,4,5].map(star => (
                             <svg key={star} className={`w-4 h-4 ${star <= r.stars ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                             </svg>
                           ))}
                        </div>
                      </div>
                      
                      {r.itemName && (
                        <div className="flex items-center gap-3 mb-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                          {r.itemImageUrl ? (
                            <img src={r.itemImageUrl} alt={r.itemName} className="w-12 h-12 rounded object-cover border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Sản phẩm đánh giá</p>
                            <p className="text-sm font-medium text-gray-900">{r.itemName}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-gray-800 text-sm">
                          {r.comment || <span className="italic text-gray-400">Người dùng không để lại lời nhắn.</span>}
                        </p>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${r.auctionId ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {r.auctionId ? (
                            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg> Giao dịch Đấu giá</>
                          ) : (
                            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> Giao dịch Chợ Đen</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination cho Modal */}
            {ratingsMeta && ratingsMeta.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-white rounded-b-2xl shrink-0">
                <span className="text-sm text-gray-600 font-medium">
                  Trang {ratingsPage + 1} / {ratingsMeta.totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRatingsPage(p => Math.max(0, p - 1))}
                    disabled={ratingsPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Trang trước
                  </button>
                  <button 
                    onClick={() => setRatingsPage(p => Math.min(ratingsMeta.totalPages - 1, p + 1))}
                    disabled={ratingsPage >= ratingsMeta.totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}