import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAuction,
  getAuctionsBySession,
  getAuctionBids,
  getLiveChatMessages,
  placeBid,
  sendLiveChatMessage,
} from "../api/auctions";
import { muteUser, unmuteUser } from "../api/adminUsers";
import { getUserProfile } from "../api/users";
import { createStompClient } from "../lib/stomp";
import { useAuthStore } from "../store/authStore";
import { formatVND } from "../utils/formatVND";
import Countdown from "../components/Countdown";
import PageHeaderFrame from "../components/PageHeaderFrame";
import { useToast } from "../context/ToastContext";

const readApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

const STATUS_META = {
  SCHEDULED: {
    label: "Đã lên lịch",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  WAITING: {
    label: "Chờ đến lượt",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ACTIVE: {
    label: "Đang diễn ra",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  PAUSED: {
    label: "Tạm dừng",
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

const AUCTION_TYPE_LABEL = {
  ENGLISH: "Đấu giá tăng dần",
  DUTCH: "Đấu giá giảm dần",
  SEALED: "Đấu giá kín",
};

const BREAK_BETWEEN_ITEMS_SECONDS = 15;

const toTimeMs = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AuctionRoomPage() {
  const { id, sessionId } = useParams();
  const isSessionRoom = Boolean(sessionId);
  const sessionRoomId = sessionId || null;
  const { user } = useAuthStore();
  const toast = useToast();

  const [auction, setAuction] = useState(null);
  const [sessionAuctions, setSessionAuctions] = useState([]);
  const [currentAuctionId, setCurrentAuctionId] = useState(
    isSessionRoom ? null : id,
  );
  const [bids, setBids] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bidAmount, setBidAmount] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetUser: null,
  });
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [profileDetail, setProfileDetail] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [itemImageIndex, setItemImageIndex] = useState(0);
  const [imageOffsetPx, setImageOffsetPx] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [isImageSliding, setIsImageSliding] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const lastErrorToastRef = useRef("");
  const lastSessionNoticeKeyRef = useRef("");
  const chatScrollRef = useRef(null);
  const effectiveAuctionId = isSessionRoom ? currentAuctionId : id;

  const parseSessionAuctions = useCallback((payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
  }, []);

  const pickCurrentAuction = useCallback((list) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const active = list.find((a) => a.status === "ACTIVE");
    if (active) return active;
    const waiting = list.find((a) => a.status === "WAITING");
    return waiting || null;
  }, []);

  const loadSessionQueue = useCallback(async () => {
    if (!isSessionRoom || !sessionRoomId) return null;
    const response = await getAuctionsBySession(sessionRoomId);
    const payload = readApiData(response);
    const list = parseSessionAuctions(payload);
    setSessionAuctions(list);
    const current = pickCurrentAuction(list);
    setCurrentAuctionId(current?.id || null);
    return current;
  }, [isSessionRoom, sessionRoomId, parseSessionAuctions, pickCurrentAuction]);

  // Load auction detail for the room header and status panel.
  const loadAuction = useCallback(async (auctionId) => {
    if (!auctionId) {
      setAuction(null);
      return;
    }
    const response = await getAuction(auctionId);
    setAuction(readApiData(response));
  }, []);

  // Load recent bid history to display latest bidding activity.
  const loadBids = useCallback(async (auctionId) => {
    if (!auctionId) {
      setBids([]);
      return;
    }
    const response = await getAuctionBids(auctionId, 0, 20);
    const payload = readApiData(response);
    setBids(payload?.content || []);
  }, []);

  // Load persisted live-chat history via REST API.
  const loadMessages = useCallback(async (auctionId) => {
    if (!auctionId) {
      setMessages([]);
      return;
    }
    const response = await getLiveChatMessages(auctionId);
    const payload = readApiData(response);
    // Handle paginated response (content array) or direct array
    const messagesArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : [];
    setMessages(messagesArray);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isSessionRoom) {
          const current = await loadSessionQueue();
          if (current?.id) {
            await Promise.all([
              loadAuction(current.id),
              loadBids(current.id),
              loadMessages(current.id),
            ]);
          } else {
            setAuction(null);
            setBids([]);
            setMessages([]);
          }
        } else if (id) {
          setCurrentAuctionId(id);
          await Promise.all([loadAuction(id), loadBids(id), loadMessages(id)]);
        }
      } catch (err) {
        console.error("[AuctionRoomPage] Failed to load room data", err);
        setError(
          err?.response?.data?.message || "Không tải được phong dau gia.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (isSessionRoom ? sessionRoomId : id) {
      run();
    }
  }, [
    isSessionRoom,
    sessionRoomId,
    id,
    loadAuction,
    loadBids,
    loadMessages,
    loadSessionQueue,
  ]);

  useEffect(() => {
    if (!isSessionRoom || !sessionRoomId) return undefined;

    const timer = setInterval(() => {
      loadSessionQueue().catch(() => {});
    }, 3000);

    return () => clearInterval(timer);
  }, [isSessionRoom, sessionRoomId, loadSessionQueue]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!effectiveAuctionId) return;
    Promise.all([
      loadAuction(effectiveAuctionId),
      loadBids(effectiveAuctionId),
      loadMessages(effectiveAuctionId),
    ]).catch(() => {});
  }, [effectiveAuctionId, loadAuction, loadBids, loadMessages]);

  useEffect(() => {
    if (!effectiveAuctionId) return undefined;

    const client = createStompClient({
      onConnect: () => {
        // Subscribe to auction updates - use payload directly for faster price updates
        client.subscribe(`/topic/auction/${effectiveAuctionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            console.log("[AuctionRoomPage] Received auction update:", payload);

            // Update auction state immediately with WebSocket data
            if (
              payload.currentPrice !== undefined ||
              payload.status ||
              payload.endTime
            ) {
              setAuction((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  currentPrice: payload.currentPrice ?? prev.currentPrice,
                  status: payload.status ?? prev.status,
                  endTime: payload.endTime ?? prev.endTime,
                  winner: payload.currentLeader ?? prev.winner,
                };
              });
              // Also reload bids to show latest bid history
              loadBids(effectiveAuctionId).catch(() => {});
              if (isSessionRoom && payload.status === "ENDED") {
                loadSessionQueue().catch(() => {});
              }
            }
          } catch (err) {
            console.error(
              "[AuctionRoomPage] Failed to parse auction update payload",
              err,
            );
            // Fallback to reloading
            loadAuction(effectiveAuctionId).catch(() => {});
            loadBids(effectiveAuctionId).catch(() => {});
            if (isSessionRoom) {
              loadSessionQueue().catch(() => {});
            }
          }
        });

        client.subscribe(`/topic/chat/${effectiveAuctionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            setMessages((prev) => [
              ...prev,
              {
                id: payload.messageId || crypto.randomUUID(),
                sender: {
                  id: payload.senderId,
                  nickname: payload.senderNickname,
                  avatarUrl: payload.senderAvatarUrl,
                },
                content: payload.content,
                createdAt: payload.timestamp,
              },
            ]);
          } catch (err) {
            console.error(
              "[AuctionRoomPage] Failed to parse websocket chat payload",
              err,
            );
            loadMessages(effectiveAuctionId).catch(() => {});
          }
        });
      },
      onWebSocketError: () => {},
      onStompError: () => {},
    });

    return () => {
      client.deactivate();
    };
  }, [
    effectiveAuctionId,
    loadAuction,
    loadBids,
    loadMessages,
    isSessionRoom,
    loadSessionQueue,
  ]);

  const formatVnd = (value) => {
    if (value == null) return "-";
    return formatVND(value);
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

  const auctionType = auction?.session?.type || auction?.type;

  const auctionTypeLabel =
    AUCTION_TYPE_LABEL[auctionType] || auctionType || "Không xác định";

  // Wrapper to execute an auction action then refresh room data.
  const submitAction = async (action) => {
    setError(null);
    try {
      await action();
      if (isSessionRoom) {
        await loadSessionQueue();
      }
      if (effectiveAuctionId) {
        await Promise.all([
          loadAuction(effectiveAuctionId),
          loadBids(effectiveAuctionId),
        ]);
      }
    } catch (err) {
      console.error("[AuctionRoomPage] Auction action failed", err);
      setError(err?.response?.data?.message || "Thao tác thất bại.");
    }
  };

  // Submit a standard bid amount.
  const handlePlaceBid = (event) => {
    event.preventDefault();
    if (!effectiveAuctionId) return;
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    submitAction(async () => {
      await placeBid(effectiveAuctionId, { amount });
      setBidAmount("");
    });
  };

  // Send chat message to auction live chat.
  const handleSendChat = async (event) => {
    event.preventDefault();
    if (!effectiveAuctionId) return;
    const content = chatInput.trim();
    if (!content) return;

    try {
      await sendLiveChatMessage(effectiveAuctionId, { content });
      setChatInput("");
    } catch (err) {
      console.error("[AuctionRoomPage] Failed to send chat message", err);
      const errorMessage =
        err?.response?.data?.message || "Gửi tin nhắn thất bại.";
      if (err?.response?.status === 403) {
        toast.error("Bạn đã bị tắt tiếng và không thể gửi tin nhắn.");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleContextMenu = (e, sender) => {
    if (user?.role !== "ADMIN") return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetUser: sender,
    });
  };

  const closeContextMenu = () =>
    setContextMenu({ visible: false, x: 0, y: 0, targetUser: null });

  const handleMuteUser = async () => {
    if (!contextMenu.targetUser) return;
    try {
      await muteUser(contextMenu.targetUser.id);
      toast.success("Đã tắt tiếng người dùng.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tắt tiếng.");
    }
    closeContextMenu();
  };

  const handleUnmuteUser = async () => {
    if (!contextMenu.targetUser) return;
    try {
      await unmuteUser(contextMenu.targetUser.id);
      toast.success("Đã bỏ tắt tiếng.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể bỏ tắt tiếng.");
    }
    closeContextMenu();
  };

  const handleViewProfile = async (sender) => {
    if (!sender?.id) return;
    setProfileModalUser(sender);
    setProfileDetail(null);
    setProfileLoading(true);
    try {
      const response = await getUserProfile(sender.id);
      setProfileDetail(readApiData(response));
    } catch (err) {
      console.error("[AuctionRoomPage] Failed to load user profile", err);
      toast.error("Không thể tải thông tin người dùng.");
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setProfileModalUser(null);
    setProfileDetail(null);
  };

  const suggestedBidAmount = useMemo(() => {
    const current = Number(auction?.currentPrice);
    const step = Number(auction?.stepPrice);
    if (!Number.isFinite(current) || !Number.isFinite(step)) return "";
    const next = current + step;
    return Number.isFinite(next) ? String(next) : "";
  }, [auction?.currentPrice, auction?.stepPrice]);

  const handleBidInputFocus = () => {
    if (bidAmount.trim().length > 0) return;
    if (!suggestedBidAmount) return;
    setBidAmount(suggestedBidAmount);
  };
  const sortedSessionAuctions = useMemo(() => {
    return [...sessionAuctions].sort((a, b) => {
      const aTime =
        toTimeMs(a?.startTime) ||
        toTimeMs(a?.createdAt) ||
        toTimeMs(a?.updatedAt) ||
        toTimeMs(a?.endTime);
      const bTime =
        toTimeMs(b?.startTime) ||
        toTimeMs(b?.createdAt) ||
        toTimeMs(b?.updatedAt) ||
        toTimeMs(b?.endTime);

      if (aTime !== bTime) return bTime - aTime;
      return (b?.orderIndex ?? 0) - (a?.orderIndex ?? 0);
    });
  }, [sessionAuctions]);
  const waitingQueue = useMemo(
    () => sortedSessionAuctions.filter((a) => a.status === "WAITING"),
    [sortedSessionAuctions],
  );
  const latestEndedInSession = useMemo(() => {
    return (
      sortedSessionAuctions
        .filter((a) => a.status === "ENDED" && a.endTime)
        .sort(
          (a, b) =>
            new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
        )[0] || null
    );
  }, [sortedSessionAuctions]);
  const breakTargetMs = useMemo(() => {
    if (!isSessionRoom) return null;
    if (auction?.status === "ACTIVE") return null;
    if (waitingQueue.length === 0) return null;
    if (!latestEndedInSession?.endTime) return null;
    return (
      new Date(latestEndedInSession.endTime).getTime() +
      BREAK_BETWEEN_ITEMS_SECONDS * 1000
    );
  }, [
    isSessionRoom,
    auction?.status,
    waitingQueue.length,
    latestEndedInSession,
  ]);
  const breakRemainingSeconds =
    breakTargetMs == null
      ? null
      : Math.max(0, Math.ceil((breakTargetMs - nowMs) / 1000));
  const isBreakBetweenItems = Boolean(
    isSessionRoom &&
    auction?.status !== "ACTIVE" &&
    waitingQueue.length > 0 &&
    breakRemainingSeconds != null &&
    breakRemainingSeconds > 0,
  );

  const itemImageUrls = useMemo(() => {
    const urls = auction?.item?.imageUrls;
    if (!Array.isArray(urls)) return [];
    return urls.filter(
      (url) => typeof url === "string" && url.trim().length > 0,
    );
  }, [auction?.item?.imageUrls]);
  const itemImageUrl = itemImageUrls[itemImageIndex] || null;
  const modalImageUrl = itemImageUrls[modalImageIndex] || null;

  useEffect(() => {
    setItemImageIndex(0);
    setModalImageIndex(0);
    setImageOffsetPx(0);
    setImageOpacity(1);
    setIsImageSliding(false);
    setIsImageModalOpen(false);
  }, [auction?.id]);

  useEffect(() => {
    if (!isImageModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isImageModalOpen]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  const handleSlideItemImage = (direction) => {
    if (itemImageUrls.length < 2 || isImageSliding) return;

    const outOffset = direction === "next" ? -14 : 14;
    const inOffset = direction === "next" ? 14 : -14;
    setIsImageSliding(true);
    setImageOffsetPx(outOffset);
    setImageOpacity(0.82);

    setTimeout(() => {
      setItemImageIndex((prev) =>
        direction === "next"
          ? (prev + 1) % itemImageUrls.length
          : (prev - 1 + itemImageUrls.length) % itemImageUrls.length,
      );
      setImageOffsetPx(inOffset);

      setTimeout(() => {
        setImageOffsetPx(0);
        setImageOpacity(1);
        setIsImageSliding(false);
      }, 16);
    }, 120);
  };

  const handlePrevItemImage = () => {
    handleSlideItemImage("prev");
  };

  const handleNextItemImage = () => {
    handleSlideItemImage("next");
  };

  const handlePrevModalImage = () => {
    if (itemImageUrls.length < 2) return;
    setModalImageIndex(
      (prev) => (prev - 1 + itemImageUrls.length) % itemImageUrls.length,
    );
  };

  const handleNextModalImage = () => {
    if (itemImageUrls.length < 2) return;
    setModalImageIndex((prev) => (prev + 1) % itemImageUrls.length);
  };

  const handleOpenImageModal = () => {
    setModalImageIndex(itemImageIndex);
    setIsImageModalOpen(true);
  };

  const endAtMs = auction?.endTime ? new Date(auction.endTime).getTime() : null;
  const remainingSeconds =
    auction?.status === "ACTIVE" && endAtMs
      ? Math.max(0, Math.ceil((endAtMs - nowMs) / 1000))
      : null;
  const isEndingSoon = remainingSeconds != null && remainingSeconds <= 30;
  const isCriticalEnding = remainingSeconds != null && remainingSeconds <= 10;

  useEffect(() => {
    if (!error) return;
    if (lastErrorToastRef.current === error) return;
    lastErrorToastRef.current = error;
    toast.error(error);
  }, [error, toast]);

  useEffect(() => {
    if (!isSessionRoom || loading) return;

    let key = "";
    let notice = "";

    if (auction?.status === "ACTIVE") {
      key = "active";
      notice = `Đang đấu giá vật phẩm: ${auction?.item?.name || "Đang cập nhật"}`;
    } else if (isBreakBetweenItems) {
      key = "break";
      notice = "Đang nghỉ giữa hai vật phẩm. Sắp mở món kế tiếp.";
    } else if (waitingQueue.length > 0) {
      key = "prepare";
      notice = "Đang chuẩn bị mở vật phẩm kế tiếp trong phiên.";
    } else {
      key = "done";
      notice = "Phiên đã hết vật phẩm chờ đấu giá.";
    }

    if (lastSessionNoticeKeyRef.current !== key) {
      lastSessionNoticeKeyRef.current = key;
      toast.warning(notice);
    }
  }, [
    isSessionRoom,
    loading,
    auction?.status,
    auction?.item?.name,
    isBreakBetweenItems,
    waitingQueue.length,
    toast,
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeaderFrame
          title="Phòng đấu giá"
          description={
            isSessionRoom
              ? "Một phòng duy nhất cho cả phiên: hệ thống tự chuyển sang vật phẩm kế tiếp khi đến lượt."
              : "Theo dõi giá thời gian thực, đặt giá và trao đổi trực tiếp trong phiên."
          }
          actions={
            isSessionRoom ? (
              <Link
                to={`/sessions/${sessionRoomId}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors font-medium"
              >
                Xem hàng chờ vật phẩm
              </Link>
            ) : undefined
          }
        />

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-600">
            Đang tải dữ liệu...
          </div>
        ) : auction ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${getStatusMeta(auction.status).className}`}
                  >
                    {getStatusMeta(auction.status).label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full border border-indigo-200 text-indigo-700">
                    {auctionTypeLabel}
                  </span>
                </div>

                <div className="">
                  <div>
                    <div className="relative w-130 h-130 block mx-auto aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt={auction.item?.name || "Vật phẩm đấu giá"}
                          className="h-full w-full object-cover cursor-zoom-in"
                          style={{
                            transform: `translateX(${imageOffsetPx}px)`,
                            opacity: imageOpacity,
                            transition:
                              "transform 180ms ease, opacity 180ms ease",
                          }}
                          onClick={handleOpenImageModal}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
                          Không có ảnh
                        </div>
                      )}

                      {itemImageUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevItemImage}
                            disabled={isImageSliding}
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-slate-800 border border-slate-200 shadow hover:bg-white disabled:opacity-60"
                            aria-label="Ảnh trước"
                          >
                            <span className="text-xl leading-none">
                              &#8592;
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleNextItemImage}
                            disabled={isImageSliding}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-slate-800 border border-slate-200 shadow hover:bg-white disabled:opacity-60"
                            aria-label="Ảnh sau"
                          >
                            <span className="text-xl leading-none">
                              &#8594;
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                    {itemImageUrls.length > 1 && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-600">
                          {itemImageIndex + 1}/{itemImageUrls.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      {auction.item?.name}
                    </h2>
                    <p className="text-slate-700 mt-2">
                      {auction.item?.description || "Không có mô tả."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div
                    className={`rounded-xl border px-4 py-4 ${
                      isCriticalEnding
                        ? "border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 shadow-lg shadow-rose-100 animate-pulse"
                        : isEndingSoon
                          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-100"
                          : "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm"
                    }`}
                  >
                    <p className="text-slate-600 font-medium">Giá hiện tại</p>
                    <p
                      className={`font-extrabold mt-1 tracking-tight ${
                        isCriticalEnding
                          ? "text-4xl text-rose-700"
                          : "text-3xl text-emerald-700"
                      }`}
                    >
                      {formatVnd(auction.currentPrice)}
                    </p>
                    {remainingSeconds != null && (
                      <p
                        className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                          isCriticalEnding
                            ? "text-rose-700"
                            : isEndingSoon
                              ? "text-amber-700"
                              : "text-emerald-700"
                        }`}
                      ></p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-slate-500">Giá khởi điểm</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {formatVnd(auction.startPrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-slate-500">Bước giá</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {formatVnd(auction.stepPrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:col-span-2">
                    <p className="text-slate-500">Thời điểm kết thúc</p>
                    {auction.status === "ACTIVE" ? (
                      <Countdown
                        endTime={auction.endTime}
                        className="font-semibold text-slate-800 mt-1"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 mt-1">
                        {formatDateTime(auction.endTime)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    {getStatusMeta(auction.status).label === "ENDED" ? (
                      <p className="text-slate-500">Người chiến thắng</p>
                    ) : (
                      <p className="text-slate-500">Người thắng tạm thời</p>
                    )}
                    <p className="font-semibold text-slate-800 mt-1">
                      {auction.winner?.nickname || "-"}
                    </p>
                  </div>
                </div>

                {/* Rate seller section - shown to winner after auction ends */}
                {auction.status === "ENDED" &&
                  user &&
                  auction.winner &&
                  user.id === auction.winner.id &&
                  auction.item?.seller && (
                    <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <h3 className="font-semibold text-emerald-800 mb-2">
                        Chúc mừng! Bạn đã thắng đấu giá
                      </h3>
                      <p className="text-sm text-emerald-700 mb-3">
                        Vui lòng đánh giá người bán{" "}
                        <span className="font-medium">
                          {auction.item.seller.nickname || "người dùng"}
                        </span>{" "}
                        về giao dịch này.
                      </p>
                      <Link
                        to={`/transactions/${auction.id}/rate?auctionId=${auction.id}&toUserName=${encodeURIComponent(auction.item.seller.nickname || "")}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Đánh giá người bán
                      </Link>
                    </div>
                  )}

                {/* Rate winner section - shown to seller after auction ends */}
                {auction.status === "ENDED" &&
                  user &&
                  auction.item?.seller &&
                  user.id === auction.item.seller.id &&
                  auction.winner && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">
                        Đấu giá đã kết thúc
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Người thắng:{" "}
                        <span className="font-medium">
                          {auction.winner.nickname || "người dùng"}
                        </span>{" "}
                        với giá {formatVnd(auction.currentPrice)}
                      </p>
                      <Link
                        to={`/transactions/${auction.id}/rate?auctionId=${auction.id}&toUserName=${encodeURIComponent(auction.winner.nickname || "")}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Đánh giá người mua
                      </Link>
                    </div>
                  )}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <form
                    onSubmit={handlePlaceBid}
                    className="border border-gray-200 rounded-xl p-4 md:col-span-2"
                  >
                    <h3 className="font-semibold mb-2 text-slate-900">
                      Đặt giá
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        onFocus={handleBidInputFocus}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        placeholder="Nhập số tiền"
                      />
                      <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                        Đặt giá
                      </button>
                    </div>
                    {suggestedBidAmount && (
                      <p className="mt-2 text-xs text-slate-600">
                        Giá gợi ý tối thiểu: {formatVnd(suggestedBidAmount)}
                      </p>
                    )}
                  </form>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-110">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Trò chuyện trực tiếp
                  </h3>
                  <div
                    ref={chatScrollRef}
                    className="space-y-2 max-h-72 overflow-y-auto mb-4 pr-1"
                  >
                    {!Array.isArray(messages) ? (
                      <p className="text-slate-600">
                        Dữ liệu tin nhắn không hợp lệ.
                      </p>
                    ) : messages.length === 0 ? (
                      <p className="text-slate-600">Chưa có tin nhắn.</p>
                    ) : (
                      messages.map((msg) => {
                        const mine = user?.id && msg.sender?.id === user.id;
                        const senderName = msg.sender?.nickname || "Ẩn danh";
                        const senderAvatar =
                          msg.sender?.avatarUrl || msg.senderAvatarUrl || null;
                        return (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${mine ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"}`}
                            onContextMenu={(e) =>
                              handleContextMenu(e, msg.sender)
                            }
                          >
                            <p className="text-sm font-medium text-slate-900">
                              {senderName}
                            </p>
                            <div className="mt-2 flex items-start gap-2">
                              <button
                                onClick={() => {
                                  if (msg.sender) handleViewProfile(msg.sender);
                                }}
                                className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                title="Xem hồ sơ"
                              >
                                {senderAvatar ? (
                                  <img
                                    src={senderAvatar}
                                    alt={senderName}
                                    className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center">
                                    {senderName.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                              </button>
                              <p className="text-sm text-slate-700">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Lịch sử trả giá
                </h3>
                {bids.length === 0 ? (
                  <p className="text-slate-600">Chưa có lượt trả giá nào.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                      >
                        <p className="text-sm text-slate-900">
                          {bid.bidder?.nickname || "Ẩn danh"}{" "}
                          {bid.proxy ? "(ủy quyền)" : ""}
                        </p>
                        <p className="text-sm font-semibold text-emerald-700">
                          {formatVnd(bid.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {isSessionRoom && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">
                      Hàng chờ vật phẩm trong phiên
                    </h3>
                    {sortedSessionAuctions.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        Chưa có dữ liệu vật phẩm.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {sortedSessionAuctions.map((q) => (
                          <div
                            key={q.id}
                            className={`rounded-lg border px-3 py-2 ${q.id === effectiveAuctionId ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900 line-clamp-1">
                                {q.item?.name || "Vật phẩm"}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${getStatusMeta(q.status).className}`}
                              >
                                {getStatusMeta(q.status).label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              Thứ tự: #{(q.orderIndex ?? 0) + 1}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Mẹo theo loại phiên
                  </h3>
                  {auctionType === "ENGLISH" && (
                    <p className="text-sm text-slate-700">
                      Giá tăng dần, hãy theo dõi bước giá và vào lệnh sớm trước
                      khi cạnh tranh cao.
                    </p>
                  )}
                  {auctionType === "DUTCH" && (
                    <p className="text-sm text-slate-700">
                      Giá giảm dần theo thời gian, cân nhắc điểm rơi phù hợp để
                      mua ngay.
                    </p>
                  )}
                  {auctionType === "SEALED" && (
                    <p className="text-sm text-slate-700">
                      Giá đặt kín chỉ gửi một lần, nên đặt mức tối ưu theo ngân
                      sách và độ hiếm vật phẩm.
                    </p>
                  )}
                  {!["ENGLISH", "DUTCH", "SEALED"].includes(
                    auctionType || "",
                  ) && (
                    <p className="text-sm text-slate-700">
                      Theo dõi thông báo hệ thống để nắm quy tắc phiên đấu giá
                      hiện tại.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-700">
            {isSessionRoom
              ? "Phiên này chưa có vật phẩm đang mở. Hệ thống sẽ tự chuyển khi đến lượt vật phẩm kế tiếp."
              : "Không tìm thấy dữ liệu phòng đấu giá."}
          </div>
        )}
      </div>

      {/* Context Menu for Admin */}
      {contextMenu.visible && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                handleViewProfile(contextMenu.targetUser);
                closeContextMenu();
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              👁️ Xem hồ sơ
            </button>
            <button
              onClick={handleMuteUser}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              🔇 Tắt tiếng
            </button>
            <button
              onClick={handleUnmuteUser}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              🔊 Bỏ tắt tiếng
            </button>
          </div>
        </>
      )}

      {/* Profile Modal */}
      {profileModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeProfileModal}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {profileLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  {profileDetail?.avatarUrl || profileModalUser?.avatarUrl ? (
                    <img
                      src={
                        profileDetail?.avatarUrl || profileModalUser?.avatarUrl
                      }
                      alt={
                        profileDetail?.nickname ||
                        profileModalUser?.nickname ||
                        "User"
                      }
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                      {(profileDetail?.nickname ||
                        profileDetail?.email ||
                        profileModalUser?.nickname ||
                        profileModalUser?.email ||
                        "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {profileDetail?.nickname ||
                        profileModalUser?.nickname ||
                        "Người dùng"}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${profileDetail?.isBanned ? "bg-red-100 text-red-700" : profileDetail?.isMuted ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                    >
                      {profileDetail?.isBanned
                        ? "Bị khóa"
                        : profileDetail?.isMuted
                          ? "Bị tắt tiếng"
                          : "Hoạt động"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">
                      {profileDetail?.email || profileModalUser?.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vai trò</p>
                    <p className="font-medium">{profileDetail?.role || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Số điện thoại</p>
                    <p className="font-medium">{profileDetail?.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Địa chỉ</p>
                    <p className="font-medium">
                      {profileDetail?.address || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Điểm uy tín</p>
                    <p className="font-medium">
                      {profileDetail?.reputationScore ?? "-"}
                    </p>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={closeProfileModal}
              className="mt-4 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Product Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-gray-500/90 text-slate-900 cursor-pointer shadow"
              aria-label="Đóng"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>

            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black">
              {modalImageUrl ? (
                <img
                  src={modalImageUrl}
                  alt={auction?.item?.name || "Vật phẩm đấu giá"}
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : (
                <div className="h-[70vh] w-full flex items-center justify-center text-slate-300 text-sm">
                  Không có ảnh
                </div>
              )}

              {itemImageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevModalImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12  cursor-pointer rounded-full bg-gray-500/90 text-slate-900  shadow "
                    aria-label="Ảnh trước"
                  >
                    <span className="text-2xl leading-none">&#8592;</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextModalImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12  cursor-pointer rounded-full bg-gray-500/90 text-slate-900  shadow"
                    aria-label="Ảnh sau"
                  >
                    <span className="text-2xl leading-none">&#8594;</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
