// User Profile & Account APIs
// GET  /api/users/me - Get current user profile
// PUT  /api/users/me - Update current user profile
// GET  /api/users/{id} - Get public user profile
// GET  /api/users/{id}/ratings - Get user ratings
// GET  /api/users/me/watchlist - Get watchlist items
// POST /api/users/me/watchlist - Add/remove from watchlist
// DELETE /api/users/me/watchlist/{itemId} - Remove from watchlist

import api from './baseApi'

/**
 * Get current user's profile
 */
export const getMyProfile = () => {
  return api.get('/users/me')
}

/**
 * Update current user's profile
 * @param {Object} data - {name, phoneNumber, ... other fields}
 */
export const updateMyProfile = (data) => {
  return api.put('/users/me', data)
}

/**
 * Get public profile of a user
 * @param {string} userId - User ID
 */
export const getUserProfile = (userId) => {
  return api.get(`/users/${userId}`)
}

/**
 * Get user's ratings/feedback (paginated)
 * @param {string} userId - User ID
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 10)
 */
export const getUserRatings = (userId, page = 0, size = 10) => {
  return api.get(`/users/${userId}/ratings`, {
    params: { page, size },
  })
}

/**
 * Get user's watchlist (paginated)
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const getWatchlist = (page = 0, size = 20) => {
  return api.get('/users/me/watchlist', {
    params: { page, size },
  })
}

/**
 * Add or remove item from watchlist (toggle)
 * @param {string} itemId - Mã vật phẩm to toggle
 */
export const toggleWatchlist = (itemId) => {
  return api.post('/users/me/watchlist', { itemId })
}

/**
 * Remove item from watchlist
 * @param {string} itemId - Mã vật phẩm to remove
 */
export const removeFromWatchlist = (itemId) => {
  return api.delete(`/users/me/watchlist/${itemId}`)
}

export default {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  getUserRatings,
  getWatchlist,
  toggleWatchlist,
  removeFromWatchlist,
}

