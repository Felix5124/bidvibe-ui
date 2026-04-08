// Rating & Feedback APIs
// POST /api/ratings - Create a rating/feedback after transaction
// GET /api/ratings/user/:userId - Get ratings for a user

import api from './baseApi'

/**
 * Create a rating or feedback for a user after transaction
 * @param {Object} data - {toUserId, auctionId, marketListingId, stars, comment}
 */
export const createRating = (data) => {
  return api.post('/ratings', data)
}

/**
 * Get ratings received by a user
 * @param {string} userId - User ID
 */
export const getUserRatings = (userId) => {
  return api.get(`/ratings/user/${userId}`)
}

export default {
  createRating,
  getUserRatings,
}
