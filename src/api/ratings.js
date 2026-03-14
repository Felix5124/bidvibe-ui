// Rating & Feedback APIs
// POST /api/ratings - Create a rating/feedback after transaction

import api from './baseApi'

/**
 * Create a rating or feedback for a user after transaction
 * @param {Object} data - {targetUserId, transactionId, rating, comment, ...}
 */
export const createRating = (data) => {
  return api.post('/ratings', data)
}

export default {
  createRating,
}
