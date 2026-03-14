// Admin User Management APIs
// GET  /api/admin/users - List users (paginated, searchable, filterable)
// GET  /api/admin/users/{id} - Get user details
// PATCH /api/admin/users/{id}/role - Change user role
// POST /api/admin/users/{id}/mute - Mute user
// POST /api/admin/users/{id}/unmute - Unmute user
// POST /api/admin/users/{id}/ban - Ban user
// POST /api/admin/users/{id}/unban - Unban user
// POST /api/admin/users/{id}/kick - Kick user from auction

import api from './baseApi'

/**
 * List all users (paginated, searchable, filterable)
 * @param {Object} filters - {search, role: 'USER'|'ADMIN', isBanned: true|false, isMuted: true|false}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const listUsers = (filters = {}, page = 0, size = 20) => {
  return api.get('/admin/users', {
    params: {
      search: filters.search,
      role: filters.role,
      isBanned: filters.isBanned,
      isMuted: filters.isMuted,
      page,
      size,
    },
  })
}

/**
 * Get user details
 * @param {string} userId - User ID
 */
export const getUserDetail = (userId) => {
  return api.get(`/admin/users/${userId}`)
}

/**
 * Change user role
 * @param {string} userId - User ID
 * @param {string} role - New role (USER or ADMIN)
 */
export const changeUserRole = (userId, role) => {
  return api.patch(`/admin/users/${userId}/role`, { role })
}

/**
 * Mute user (prevent from posting messages)
 * @param {string} userId - User ID
 */
export const muteUser = (userId) => {
  return api.post(`/admin/users/${userId}/mute`)
}

/**
 * Unmute user
 * @param {string} userId - User ID
 */
export const unmuteUser = (userId) => {
  return api.post(`/admin/users/${userId}/unmute`)
}

/**
 * Ban user
 * @param {string} userId - User ID
 */
export const banUser = (userId) => {
  return api.post(`/admin/users/${userId}/ban`)
}

/**
 * Unban user
 * @param {string} userId - User ID
 */
export const unbanUser = (userId) => {
  return api.post(`/admin/users/${userId}/unban`)
}

/**
 * Kick user from an auction
 * @param {string} userId - User ID
 * @param {string} auctionId - Auction ID
 */
export const kickUserFromAuction = (userId, auctionId) => {
  return api.post(`/admin/users/${userId}/kick`, { auctionId })
}

export default {
  listUsers,
  getUserDetail,
  changeUserRole,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  kickUserFromAuction,
}
