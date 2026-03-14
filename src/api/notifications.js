// Notification APIs
// GET  /api/notifications - Get notifications (paginated)
// GET  /api/notifications/unread-count - Get unread notification count
// POST /api/notifications/read-all - Mark all as read
// PATCH /api/notifications/{id}/read - Mark single notification as read

import api from './baseApi'

/**
 * Get user's notifications (paginated)
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const getNotifications = (page = 0, size = 20) => {
  return api.get('/notifications', {
    params: { page, size },
  })
}

/**
 * Get count of unread notifications
 */
export const getUnreadCount = () => {
  return api.get('/notifications/unread-count')
}

/**
 * Mark all notifications as read
 */
export const markAllAsRead = () => {
  return api.post('/notifications/read-all')
}

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification ID
 */
export const markAsRead = (notificationId) => {
  return api.patch(`/notifications/${notificationId}/read`)
}

export default {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
}
