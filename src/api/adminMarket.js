// Admin Market APIs
// GET /api/admin/market/listings/{id}/messages - Get listing dispute messages

import api from './baseApi'

/**
 * Get dispute/negotiation messages for a market listing (admin view)
 * @param {string} listingId - Listing ID
 */
export const getListingDisputeMessages = (listingId) => {
  return api.get(`/admin/market/listings/${listingId}/messages`)
}

export default {
  getListingDisputeMessages,
}
