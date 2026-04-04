import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { getUnreadCount } from "../api/notifications";

const navLinkClass = ({ isActive }) =>
  `font-medium transition-colors ${isActive ? "text-blue-700" : "text-gray-700 hover:text-blue-600"}`;

export default function AppNavbar() {
  const { user, logout } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const displayName =
    user?.nickname || user?.email?.split("@")?.[0] || "Người dùng";

  // Fetch unread count on mount
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const response = await getUnreadCount();
        const count = response?.data?.data ?? response?.data ?? 0;
        setUnreadCount(Number(count));
      } catch (err) {
        console.error("[AppNavbar] Failed to fetch unread count", err);
      }
    };

    fetchUnread();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, setUnreadCount]);

  return (
    <nav className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link
            to={user ? "/" : "/login"}
            className="text-2xl font-bold text-blue-600"
          >
            BidVibe
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" className={navLinkClass}>
                Trang chủ
              </NavLink>
              <NavLink to="/sessions" className={navLinkClass}>
                Phiên đấu giá
              </NavLink>
              <NavLink to="/market" className={navLinkClass}>
                Chợ đen
              </NavLink>
              <NavLink to="/me/inventory" className={navLinkClass}>
                Kho đồ
              </NavLink>
              <NavLink to="/me/profile" className={navLinkClass}>
                Hồ sơ
              </NavLink>
              {user.role === "ADMIN" ? (
                <NavLink to="/admin" className={navLinkClass}>
                  Bảng điều khiển
                </NavLink>
              ) : (
                <NavLink to="/me/wallet" className={navLinkClass}>
                  Ví tiền
                </NavLink>
              )}
              <NavLink
                to="/me/notifications"
                className={({ isActive }) =>
                  `font-medium transition-colors flex items-center gap-1 ${isActive ? "text-blue-700" : "text-gray-700 hover:text-blue-600"}`
                }
              >
                Thông báo
                {unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-5 text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5">
              <Link
                to="/me/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="Xem hồ sơ"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-700 max-w-45 truncate">
                  {displayName}
                </p>
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm cursor-pointer ml-2"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
