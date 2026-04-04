// Market Listing APIs
// GET    /api/market/listings - Search listings (paginated & filterable)
// POST   /api/market/listings - Create a new listing
// GET    /api/market/listings/{id} - Get listing details
// DELETE /api/market/listings/{id} - Cancel listing
// POST   /api/market/listings/{id}/buy - Buy a listing
// GET    /api/market/listings/{id}/messages - Get negotiation messages
// POST   /api/market/listings/{id}/messages - Send negotiation message

import api from './baseApi'

const normalizeListing = (listing = {}) => ({
  ...listing,
  askingPrice: Number(listing.askingPrice ?? listing.asking_price ?? 0),
  createdAt: listing.createdAt ?? listing.created_at,
  updatedAt: listing.updatedAt ?? listing.updated_at,
  item: listing.item ?? {
    id: listing.item_id,
    name: listing.item_name,
    description: listing.item_description,
    imageUrls: listing.item_images ?? [],
    rarity: listing.item_rarity,
    tags: listing.item_tags ?? [],
  },
  seller: listing.seller ?? {
    id: listing.seller_id,
    nickname: listing.seller_nickname,
    reputationScore: listing.seller_score,
  },
  buyer: listing.buyer ?? (listing.buyer_id ? { id: listing.buyer_id } : null),
})

const normalizeMessage = (message = {}) => ({
  ...message,
  createdAt: message.createdAt ?? message.created_at,
  sender: message.sender ?? {
    id: message.sender_id,
    nickname: message.sender_nickname,
    avatarUrl: message.sender_avatar,
  },
})

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
  }).then((response) => {
    const payload = response?.data?.data
    if (payload && Array.isArray(payload.content)) {
      response.data.data = {
        ...payload,
        content: payload.content.map(normalizeListing),
      }
    }
    return response
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
  return api.get(`/market/listings/${listingId}`).then((response) => {
    const payload = response?.data?.data
    if (payload) {
      response.data.data = normalizeListing(payload)
    }
    return response
  })
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
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 50)
 */
export const getListingMessages = (listingId, page = 0, size = 50) => {
  return api.get(`/market/listings/${listingId}/messages`, {
    params: { page, size },
  }).then((response) => {
    const payload = response?.data?.data
    if (Array.isArray(payload)) {
      response.data.data = payload.map(normalizeMessage)
    } else if (payload && Array.isArray(payload.content)) {
      response.data.data = {
        ...payload,
        content: payload.content.map(normalizeMessage),
      }
    }
    return response
  })
}

/**
 * Send a negotiation message on a listing
 * @param {string} listingId - Listing ID
 * @param {Object} data - {content}
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
