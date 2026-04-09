import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import {
  getBalance,
  getTransactionHistory,
  requestDeposit,
  requestWithdraw,
} from "../api/wallet";
import PageHeaderFrame from "../components/PageHeaderFrame";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;
const DEPOSIT_PRESETS = [50000, 100000, 200000, 500000];
const QR_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'><rect width='100%' height='100%' fill='%23f1f5f9'/><rect x='20' y='20' width='240' height='240' fill='%23ffffff' stroke='%2394a3b8' stroke-width='2'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23334155' font-family='Arial'>QR PLACEHOLDER</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%2364748b' font-family='Arial'>Them anh QR sau</text></svg>";

export default function WalletPage() {
  const toast = useToast();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txMeta, setTxMeta] = useState(null);
  const [txPage, setTxPage] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState("deposit");

  const [selectedDepositAmount, setSelectedDepositAmount] = useState(
    DEPOSIT_PRESETS[0],
  );
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [depositInvoice, setDepositInvoice] = useState(null);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
  });

  // Load wallet balance summary.
  const loadWallet = useCallback(async () => {
    const response = await getBalance();
    setBalance(readApiData(response));
  }, []);

  // Load paginated wallet transactions.
  const loadTransactions = useCallback(async (page = 0) => {
    const response = await getTransactionHistory({}, page, 10);
    const payload = readApiData(response);
    setTransactions(payload?.content || []);
    setTxMeta(payload?.meta || null);
  }, []);

  // Load balance + transaction list in a single refresh cycle.
  const loadAll = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadWallet(), loadTransactions(page)]);
      } catch (err) {
        console.error("[WalletPage] Failed to load wallet data", err);
        setError(err?.response?.data?.message || "Không tải được dữ liệu ví.");
      } finally {
        setLoading(false);
      }
    },
    [loadTransactions, loadWallet],
  );

  useEffect(() => {
    loadAll(txPage);
  }, [loadAll, txPage]);

  const formatVnd = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + " VND";
  };

  const formatTransactionType = (type) => {
    if (type === "DEPOSIT") return "Nạp tiền";
    if (type === "WITHDRAW") return "Rút tiền";
    if (type === "BID_LOCK") return "Khóa tiền đấu giá";
    if (type === "BID_UNLOCK") return "Mở khóa tiền đấu giá";
    if (type === "FINAL_PAYMENT") return "Thanh toán cuối";
    if (type === "PLATFORM_FEE") return "Phí nền tảng";
    return type || "-";
  };

  const formatTransactionStatus = (status) => {
    if (status === "PENDING") return "Chờ xử lý";
    if (status === "COMPLETED") return "Thành công";
    if (status === "CANCELLED") return "Đã hủy";
    if (status === "FAILED") return "Thất bại";
    return status || "-";
  };

  const getAmountPresentation = (tx) => {
    const type = tx?.type;
    const status = tx?.status;
    let direction = "neutral";

    if (type === "DEPOSIT") {
      direction = status === "COMPLETED" ? "in" : "neutral";
    } else if (type === "WITHDRAW") {
      direction = status === "CANCELLED" ? "in" : "out";
    } else if (type === "BID_UNLOCK") {
      direction = "in";
    } else if (type === "BID_LOCK" || type === "PLATFORM_FEE") {
      direction = "out";
    } else if (type === "FINAL_PAYMENT") {
      // FINAL_PAYMENT có thể là nhận tiền (seller) hoặc chi tiền (buyer).
      // Nếu chưa có metadata phân biệt, mặc định hiển thị là chi ra.
      direction = "out";
    }

    const sign = direction === "in" ? "+" : direction === "out" ? "-" : "";
    const className =
      direction === "in"
        ? "text-emerald-700"
        : direction === "out"
          ? "text-red-600"
          : "text-slate-700";

    return {
      label: `${sign}${formatVnd(tx?.amount)}`,
      className,
    };
  };

  // Create a deposit invoice and submit pending deposit request for admin approval.
  const createDepositInvoice = async () => {
    if (isCreatingInvoice) return;
    const amount = Number(selectedDepositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.warning("Vui lòng chọn mệnh giá nạp hợp lệ.");
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const response = await requestDeposit({
        amount,
        note: `NAP-${Date.now()}`,
      });
      const tx = readApiData(response);
      setDepositInvoice({
        id: tx?.id || null,
        amount,
        createdAt: tx?.createdAt || new Date().toISOString(),
        status: tx?.status || "PENDING",
      });
      toast.success(
        "Đã tạo hóa đơn nạp tiền. Yêu cầu đã gửi lên admin để duyệt.",
      );
      await loadAll(txPage);
    } catch (err) {
      console.error("[WalletPage] Failed to create deposit invoice", err);
      toast.error(
        err?.response?.data?.message || "Không thể tạo hóa đơn nạp tiền.",
      );
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Submit withdraw request.
  const submitWithdraw = async (event) => {
    event.preventDefault();
    try {
      await requestWithdraw({
        amount: Number(withdrawForm.amount),
        bankAccountName: withdrawForm.bankAccountName,
        bankAccountNumber: withdrawForm.bankAccountNumber,
        bankName: withdrawForm.bankName,
      });
      toast.success("Đã gửi yêu cầu rút tiền. Vui lòng chờ duyệt.");
      setWithdrawForm({
        amount: "",
        bankAccountName: "",
        bankAccountNumber: "",
        bankName: "",
      });
      await loadAll(txPage);
    } catch (err) {
      console.error("[WalletPage] Failed to request withdraw", err);
      toast.error(
        err?.response?.data?.message || "Gửi yêu cầu rút tiền thất bại.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Ví tiền"
          description="Quản lý số dư, gửi yêu cầu nạp rút và theo dõi lịch sử giao dịch của bạn."
          actions={
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors font-medium"
            >
              Về trang chủ
            </Link>
          }
        />

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-600">
            Đang tải du lieu...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {formatVnd(balance?.balanceAvailable)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-600">Locked</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {formatVnd(balance?.balanceLocked)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatVnd(balance?.totalBalance)}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveAction("deposit")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeAction === "deposit" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Nạp tiền
              </button>
              <button
                type="button"
                onClick={() => setActiveAction("withdraw")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeAction === "withdraw" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Rút tiền
              </button>
            </div>

            {activeAction === "deposit" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
                <h2 className="text-xl font-semibold">Tạo hóa đơn nạp tiền</h2>
                <p className="text-sm text-slate-600">
                  Chọn mệnh giá nạp. Hệ thống sẽ tạo yêu cầu nạp tiền để admin
                  duyệt.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DEPOSIT_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedDepositAmount(amount)}
                      className={`px-4 py-3 rounded-lg border text-sm font-semibold transition ${selectedDepositAmount === amount ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
                    >
                      {new Intl.NumberFormat("vi-VN").format(amount)} VND
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={createDepositInvoice}
                  disabled={isCreatingInvoice}
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isCreatingInvoice
                    ? "Đang tạo hóa đơn..."
                    : "Tạo hóa đơn nạp tiền"}
                </button>

                {depositInvoice && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-4">
                    <img
                      src={"../image.png"}
                      alt="QR nạp tiền"
                      className="w-full max-w-[280px] rounded-lg border border-slate-300 bg-white"
                    />
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-slate-900">
                        Hóa đơn nạp tiền
                      </p>
                      <p className="text-slate-700">
                        Mã hóa đơn: {depositInvoice.id || "Đang tạo mã"}
                      </p>
                      <p className="text-slate-700">
                        Số tiền:{" "}
                        <span className="font-semibold text-emerald-700">
                          {formatVnd(depositInvoice.amount)}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        Trạng thái:{" "}
                        <span className="font-semibold">
                          {depositInvoice.status}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        Thời gian tạo:{" "}
                        {new Date(depositInvoice.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </p>
                      <p className="text-xs text-slate-500 pt-2">
                        Bạn có thể thay ảnh QR bằng ảnh thật sau. Yêu cầu nạp đã
                        được gửi lên bảng điều khiển giao dịch admin.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeAction === "withdraw" && (
              <form
                onSubmit={submitWithdraw}
                className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 mb-6"
              >
                <h2 className="text-xl font-semibold">Tạo yêu cầu rút tiền</h2>
                <input
                  type="number"
                  min="0"
                  required
                  value={withdrawForm.amount}
                  onChange={(e) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Số tiền"
                />
                <input
                  required
                  value={withdrawForm.bankAccountName}
                  onChange={(e) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      bankAccountName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Tên chủ tài khoản"
                />
                <input
                  required
                  value={withdrawForm.bankAccountNumber}
                  onChange={(e) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      bankAccountNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Số tài khoản"
                />
                <input
                  required
                  value={withdrawForm.bankName}
                  onChange={(e) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      bankName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Tên ngân hàng"
                />
                <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Gửi yêu cầu rút
                </button>
              </form>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Lịch sử giao dịch</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-600">Chưa có giao dịch nào.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="border border-gray-200 rounded p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatTransactionType(tx.type)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tx.description || "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${getAmountPresentation(tx).className}`}
                        >
                          {getAmountPresentation(tx).label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTransactionStatus(tx.status)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {txMeta && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Trang {txMeta.page + 1} / {Math.max(txMeta.totalPages, 1)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                      disabled={txPage === 0}
                      className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
                    >
                      Truoc
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTxPage((p) =>
                          txMeta.totalPages > p + 1 ? p + 1 : p,
                        )
                      }
                      disabled={txMeta.totalPages <= txPage + 1}
                      className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
