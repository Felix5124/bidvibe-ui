// Market Listing APIs
// GET    /api/market/listings - Search listings (paginated & filterable)
// POST   /api/market/listings - Create a new listing
// GET    /api/market/listings/me/active - Get current seller active listings
// GET    /api/market/listings/{id} - Get listing details
// DELETE /api/market/listings/{id} - Cancel listing
// POST   /api/market/listings/{id}/buy - Buy a listing
// PATCH  /api/market/listings/{id}/price - Update listing price (seller)
// GET    /api/market/listings/{id}/messages - Get negotiation messages
// POST   /api/market/listings/{id}/messages - Send negotiation message

import api from "./baseApi";

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
});

const normalizeMessage = (message = {}) => ({
  ...message,
  createdAt: message.createdAt ?? message.created_at,
  sender: message.sender ?? {
    id: message.sender_id,
    nickname: message.sender_nickname,
    avatarUrl: message.sender_avatar,
  },
});

/**
 * Search market listings (paginated & filterable)
 * @param {Object} filters - {keyword, rarity: 'COMMON'|'RARE'|'LEGENDARY'|...}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const searchListings = (filters = {}, page = 0, size = 20) => {
  return api.get("/market/listings", {
    params: {
      keyword: filters.keyword,
      rarity: filters.rarity,
      page,
      size,
    },
  });
};

/**
 * Create a new market listing
 * @param {Object} data - {itemId, askingPrice}
 */
export const createListing = (data) => {
  return api.post("/market/listings", data);
};

/**
 * Get active listings of current seller
 */
export const getMyActiveListings = () => {
  return api.get("/market/listings/me/active");
};

/**
 * Get market listing details
 * @param {string} listingId - Listing ID
 */
export const getListingDetail = (listingId) => {
  return api.get(`/market/listings/${listingId}`);
};

/**
 * Cancel a market listing (only by listing owner)
 * @param {string} listingId - Listing ID
 */
export const cancelListing = (listingId) => {
  return api.delete(`/market/listings/${listingId}`);
};

/**
 * Buy a listing
 * @param {string} listingId - Listing ID
 */
export const buyListing = (listingId) => {
  return api.post(`/market/listings/${listingId}/buy`);
};

/**
 * Update asking price of a listing
 * @param {string} listingId - Listing ID
 * @param {number|string} askingPrice - New asking price
 */
export const updateListingPrice = (listingId, askingPrice) => {
  return api.patch(`/market/listings/${listingId}/price`, { askingPrice });
};

/**
 * Get negotiation/chat messages for a listing
 * @param {string} listingId - Listing ID
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 50)
 */
export const getListingMessages = (listingId, page = 0, size = 50) => {
  return api.get(`/market/listings/${listingId}/messages`, {
    params: { page, size },
  });
};

/**
 * Send a negotiation message on a listing
 * @param {string} listingId - Listing ID
 * @param {Object} data - {content}
 */
export const sendListingMessage = (listingId, data) => {
  return api.post(`/market/listings/${listingId}/messages`, data);
};

export default {
  searchListings,
  createListing,
  getMyActiveListings,
  getListingDetail,
  cancelListing,
  buyListing,
  updateListingPrice,
  getListingMessages,
  sendListingMessage,
};
