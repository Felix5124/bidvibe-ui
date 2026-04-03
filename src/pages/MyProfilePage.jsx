import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { getMyProfile, updateMyProfile } from "../api/users";
import { uploadFileToSupabase } from "../lib/supabase";
import PageHeaderFrame from "../components/PageHeaderFrame";
import { useAuthStore } from "../store/authStore";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

export default function MyProfilePage() {
  const toast = useToast();
  const { user } = useAuthStore(); // Lấy user từ store để dùng googleAvatar fallback
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nickname: "",
    avatarUrl: "",
    phone: "",
    address: "",
  });

  // Hiển thị Avatar: Ưu tiên form.avatarUrl -> avatar_url trong DB -> Google Avatar -> Ảnh mặc định
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

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- XỬ LÝ KÉO THẢ VÀ UPLOAD ẢNH ---
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
  // -----------------------------------

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
    <div className="min-h-screen bg-gray-50">
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
                <p>
                  Uy tín:{" "}
                  <span className="font-semibold text-yellow-600">
                    {profile?.reputationScore ?? "-"} ⭐
                  </span>
                </p>
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

              {/* VÙNG KÉO THẢ AVATAR */}
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
    </div>
  );
}
