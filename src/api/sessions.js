// Auction Session APIs
// GET /api/sessions - List all auction sessions (paginated)
// GET /api/sessions/{id} - Get session details
// GET /api/sessions/{id}/auctions - Get all auctions in a session

import api from './baseApi'

/**
 * List all auction sessions (paginated and filterable)
 * @param {Object} filters - {status: 'ACTIVE'|'COMPLETED', type: 'ENGLISH'|'SEALED'|'DUTCH'|'VICKREY'}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 10)
 */
export const listSessions = (filters = {}, page = 0, size = 10) => {
  return api.get('/sessions', {
    params: {
      status: filters.status,
      type: filters.type,
      page,
      size,
    },
  })
}

/**
 * Get auction session details
 * @param {string} sessionId - Session ID
 */
export const getSession = (sessionId) => {
  return api.get(`/sessions/${sessionId}`)
}

/**
 * Get all auctions in a session
 * @param {string} sessionId - Session ID
 */
export const getSessionAuctions = (sessionId) => {
  return api.get(`/sessions/${sessionId}/auctions`)
}

export default {
  listSessions,
  getSession,
  getSessionAuctions,
}
