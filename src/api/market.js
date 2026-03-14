// Market Listing APIs
// GET    /api/market/listings - Search listings (paginated & filterable)
// POST   /api/market/listings - Create a new listing
// GET    /api/market/listings/{id} - Get listing details
// DELETE /api/market/listings/{id} - Cancel listing
// POST   /api/market/listings/{id}/buy - Buy a listing
// GET    /api/market/listings/{id}/messages - Get negotiation messages
// POST   /api/market/listings/{id}/messages - Send negotiation message

import api from './baseApi'

/**
 * Search market listings (paginated & filterable)
 * @param {Object} filters - {keyword, rarity: 'COMMON'|'RARE'|'LEGENDARY'|...}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const searchListings = (filters = {}, page = 0, size = 20) => {
  return api.get('/market/listings', {
    params: {
      keyword: filters.keyword,
      rarity: filters.rarity,
      page,
      size,
    },
  })
}

/**
 * Create a new market listing
 * @param {Object} data - {itemId, askingPrice}
 */
export const createListing = (data) => {
  return api.post('/market/listings', data)
}

/**
 * Get market listing details
 * @param {string} listingId - Listing ID
 */
export const getListingDetail = (listingId) => {
  return api.get(`/market/listings/${listingId}`)
}

/**
 * Cancel a market listing (only by listing owner)
 * @param {string} listingId - Listing ID
 */
export const cancelListing = (listingId) => {
  return api.delete(`/market/listings/${listingId}`)
}

/**
 * Buy a listing
 * @param {string} listingId - Listing ID
 */
export const buyListing = (listingId) => {
  return api.post(`/market/listings/${listingId}/buy`)
}

/**
 * Get negotiation/chat messages for a listing
 * @param {string} listingId - Listing ID
 */
export const getListingMessages = (listingId) => {
  return api.get(`/market/listings/${listingId}/messages`)
}

/**
 * Send a negotiation message on a listing
 * @param {string} listingId - Listing ID
 * @param {Object} data - {message}
 */
export const sendListingMessage = (listingId, data) => {
  return api.post(`/market/listings/${listingId}/messages`, data)
}

export default {
  searchListings,
  createListing,
  getListingDetail,
  cancelListing,
  buyListing,
  getListingMessages,
  sendListingMessage,
}
