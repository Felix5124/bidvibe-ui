// Admin Auction Session Management APIs
// POST   /api/admin/sessions - Create auction session
// GET    /api/admin/sessions - List sessions (paginated, filterable)
// GET    /api/admin/sessions/{id} - Get session details
// GET    /api/admin/sessions/{id}/auctions - Get auctions in session
// POST   /api/admin/sessions/{id}/auctions - Thêm vật phẩm to session
// DELETE /api/admin/sessions/{id}/auctions/{auctionId} - Remove auction from session
// POST   /api/admin/sessions/{id}/start - Activate session
// POST   /api/admin/sessions/{id}/pause - Pause session
// POST   /api/admin/sessions/{id}/resume - Resume session
// POST   /api/admin/sessions/{id}/stop - Stop session
// POST   /api/admin/auctions/{id}/reset-timer - Reset auction timer
// DELETE /api/admin/auctions/{auctionId}/bids/{bidId} - Remove bid from auction

import api from "./baseApi";

const normalizeSessionAuction = (auction = {}) => ({
  ...auction,
  currentPrice: Number(auction.currentPrice ?? auction.current_price ?? 0),
  startPrice: Number(auction.startPrice ?? auction.start_price ?? 0),
  endTime: auction.endTime ?? auction.end_time,
  item: auction.item ?? {
    id: auction.item_id,
    name: auction.item_name,
    description: auction.item_description,
    imageUrls: auction.item_images ?? [],
    rarity: auction.item_rarity,
    tags: auction.item_tags ?? [],
  },
});

/**
 * Create a new auction session
 * @param {Object} data - {name, type: 'ENGLISH'|'SEALED'|'DUTCH'|'VICKREY', startTime, endTime, ...}
 */
export const createSession = (data) => {
  return api.post("/admin/sessions", data);
};

/**
 * List all auction sessions (paginated, filterable)
 * @param {Object} filters - {status: 'ACTIVE'|'COMPLETED'|'PAUSED'|..., type: 'ENGLISH'|'SEALED'|...}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 10)
 */
export const listSessions = (filters = {}, page = 0, size = 10) => {
  return api.get("/admin/sessions", {
    params: {
      status: filters.status,
      type: filters.type,
      page,
      size,
    },
  });
};

/**
 * Get session details
 * @param {string} sessionId - Session ID
 */
export const getSessionDetail = (sessionId) => {
  return api.get(`/admin/sessions/${sessionId}`);
};

/**
 * Get all auctions in a session
 * @param {string} sessionId - Session ID
 */
export const getSessionAuctions = (sessionId) => {
  return api.get(`/admin/sessions/${sessionId}/auctions`).then((response) => {
    const payload = response?.data?.data;
    if (Array.isArray(payload)) {
      response.data.data = payload.map(normalizeSessionAuction);
    } else if (payload && Array.isArray(payload.content)) {
      response.data.data = {
        ...payload,
        content: payload.content.map(normalizeSessionAuction),
      };
    }
    return response;
  });
};

/**
 * Thêm vật phẩm to auction session
 * @param {string} sessionId - Session ID
 * @param {Object} data - {itemId, startPrice, endPrice, duration, ...}
 */
export const addItemToSession = (sessionId, data) => {
  return api.post(`/admin/sessions/${sessionId}/auctions`, data);
};

/**
 * Remove auction from session
 * @param {string} sessionId - Session ID
 * @param {string} auctionId - Auction ID
 */
export const removeAuctionFromSession = (sessionId, auctionId) => {
  return api.delete(`/admin/sessions/${sessionId}/auctions/${auctionId}`);
};

/**
 * Activate/Start auction session
 * @param {string} sessionId - Session ID
 */
export const activateSession = (sessionId) => {
  return api.post(`/admin/sessions/${sessionId}/start`);
};

/**
 * Pause auction session
 * @param {string} sessionId - Session ID
 */
export const pauseSession = (sessionId) => {
  return api.post(`/admin/sessions/${sessionId}/pause`);
};

/**
 * Resume auction session
 * @param {string} sessionId - Session ID
 */
export const resumeSession = (sessionId) => {
  return api.post(`/admin/sessions/${sessionId}/resume`);
};

/**
 * Stop auction session
 * @param {string} sessionId - Session ID
 */
export const stopSession = (sessionId) => {
  return api.post(`/admin/sessions/${sessionId}/stop`);
};

/**
 * Reset timer for an auction
 * @param {string} auctionId - Auction ID
 */
export const resetAuctionTimer = (auctionId, minutes) => {
  return api.post(`/admin/auctions/${auctionId}/reset-timer`, null, {
    params: {
      minutes,
    },
  });
};

/**
 * Remove a bid from auction history (admin moderation)
 * @param {string} auctionId - Auction ID
 * @param {string} bidId - Bid ID
 */
export const removeAuctionBid = (auctionId, bidId) => {
  return api.delete(`/admin/auctions/${auctionId}/bids/${bidId}`);
};

export default {
  createSession,
  listSessions,
  getSessionDetail,
  getSessionAuctions,
  addItemToSession,
  removeAuctionFromSession,
  activateSession,
  pauseSession,
  resumeSession,
  stopSession,
  resetAuctionTimer,
  removeAuctionBid,
};
