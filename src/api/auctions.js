// Auction & Bidding APIs
// GET  /api/auctions/{id} - Get auction details
// GET  /api/auctions/{id}/bids - Get bid history (paginated)
// POST /api/auctions/{id}/bids - Place a regular bid
// POST /api/auctions/{id}/buy - Buy now
// POST /api/auctions/{id}/sealed-bid - Submit sealed bid
// POST /api/auctions/{id}/proxy-bid - Set proxy bid
// DELETE /api/auctions/{id}/proxy-bid - Cancel proxy bid
// GET  /api/auctions/{id}/messages - Get live chat messages
// POST /api/auctions/{id}/messages - Send live chat message

import api from './baseApi'

/**
 * Get auction details
 * @param {string} auctionId - Auction ID
 */
export const getAuction = (auctionId) => {
  return api.get(`/auctions/${auctionId}`)
}

/**
 * Get bid history for an auction (paginated)
 * @param {string} auctionId - Auction ID
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const getAuctionBids = (auctionId, page = 0, size = 20) => {
  return api.get(`/auctions/${auctionId}/bids`, {
    params: { page, size },
  })
}

/**
 * Place a regular bid on an auction
 * @param {string} auctionId - Auction ID
 * @param {Object} data - {amount}
 */
export const placeBid = (auctionId, data) => {
  return api.post(`/auctions/${auctionId}/bids`, data)
}

/**
 * Buy item now (skip auction)
 * @param {string} auctionId - Auction ID
 * @param {Object} data - Optional request body
 */
export const buyNow = (auctionId, data = {}) => {
  return api.post(`/auctions/${auctionId}/buy`, data)
}

/**
 * Submit a sealed bid (for sealed bid auctions)
 * @param {string} auctionId - Auction ID
 * @param {Object} data - {amount}
 */
export const submitSealedBid = (auctionId, data) => {
  return api.post(`/auctions/${auctionId}/sealed-bid`, data)
}

/**
 * Set a proxy bid (automatic bidding)
 * @param {string} auctionId - Auction ID
 * @param {Object} data - {maxAmount}
 */
export const setProxyBid = (auctionId, data) => {
  return api.post(`/auctions/${auctionId}/proxy-bid`, data)
}

/**
 * Cancel proxy bid
 * @param {string} auctionId - Auction ID
 */
export const cancelProxyBid = (auctionId) => {
  return api.delete(`/auctions/${auctionId}/proxy-bid`)
}

/**
 * Get live chat messages for an auction
 * @param {string} auctionId - Auction ID
 */
export const getLiveChatMessages = (auctionId) => {
  return api.get(`/auctions/${auctionId}/messages`)
}

/**
 * Send a live chat message in an auction
 * @param {string} auctionId - Auction ID
 * @param {Object} data - {message}
 */
export const sendLiveChatMessage = (auctionId, data) => {
  return api.post(`/auctions/${auctionId}/messages`, data)
}

export default {
  getAuction,
  getAuctionBids,
  placeBid,
  buyNow,
  submitSealedBid,
  setProxyBid,
  cancelProxyBid,
  getLiveChatMessages,
  sendLiveChatMessage,
}
