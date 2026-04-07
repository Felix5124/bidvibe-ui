// Item Management APIs
// POST /api/items - Submit item for approval
// GET  /api/items/me/inventory - Get user's inventory (paginated)
// GET  /api/items/{id} - Get item details
// PATCH /api/items/{id}/confirm-receipt - Confirm item receipt
// POST /api/items/list-on-market - List item on market

import api from './baseApi'

/**
 * Submit an item for approval
 * @param {Object} data - {name, description, rarity, images, ... other fields}
 */
export const submitItem = (data) => {
  return api.post('/items', data)
}

/**
 * Get user's inventory (paginated)
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const getInventory = (page = 0, size = 20) => {
  return api.get('/items/me/inventory', {
    params: { page, size },
  })
}

/**
 * Get item details
 * @param {string} itemId - Mã vật phẩm
 */
export const getItemDetail = (itemId) => {
  return api.get(`/items/${itemId}`)
}

/**
 * Confirm receipt of an item
 * @param {string} itemId - Mã vật phẩm
 */
export const confirmReceipt = (itemId) => {
  return api.patch(`/items/${itemId}/confirm-receipt`)
}

/**
 * Delete an item that has been rejected
 * @param {string} itemId - Mã vật phẩm
 */
export const deleteRejectedItem = (itemId) => {
  return api.delete(`/items/${itemId}`)
}

/**
 * List an item on the market
 * @param {Object} data - {itemId, askingPrice}
 */
export const listOnMarket = (data) => {
  return api.post('/items/list-on-market', data)
}
export const requestShipping = (id) =>
  api.patch(`/items/${id}/request-shipping`);

export default {
  submitItem,
  getInventory,
  getItemDetail,
  confirmReceipt,
  deleteRejectedItem,
  listOnMarket,
}

