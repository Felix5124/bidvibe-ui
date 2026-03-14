// Analytics APIs
// GET /api/analytics/items/{id}/price-history - Get price history of an item

import api from './baseApi'

/**
 * Get price history of an item
 * @param {string} itemId - Item ID
 */
export const getPriceHistory = (itemId) => {
  return api.get(`/analytics/items/${itemId}/price-history`)
}

export default {
  getPriceHistory,
}
