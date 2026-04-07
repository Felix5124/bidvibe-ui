// Admin Item Management APIs
// GET  /api/admin/items - List items (paginated, filterable by status)
// GET  /api/admin/items/{id} - Get item details
// POST /api/admin/items/{id}/approve - Approve item
// POST /api/admin/items/{id}/reject - Reject item

import api from "./baseApi";

/**
 * List all items (paginated, filterable)
 * @param {Object} filters - {status: 'PENDING'|'APPROVED'|'REJECTED'|...}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const listItems = (filters = {}, page = 0, size = 20) => {
  return api.get("/admin/items", {
    params: {
      status: filters.status,
      page,
      size,
    },
  });
};

/**
 * Get item details
 * @param {string} itemId - Mã vật phẩm
 */
export const getItemDetail = (itemId) => {
  return api.get(`/admin/items/${itemId}`);
};

/**
 * Approve an item and add it to auction
 * @param {string} itemId - Mã vật phẩm
 * @param {Object} data - {rarity: 'COMMON'|'RARE'|'LEGENDARY'|..., tags: []}
 */
export const approveItem = (itemId, data) => {
  return api.post(`/admin/items/${itemId}/approve`, data);
};

/**
 * Reject an item
 * @param {string} itemId - Mã vật phẩm
 * @param {Object} data - {reason: 'string'}
 */
export const rejectItem = (itemId, data) => {
  return api.post(`/admin/items/${itemId}/reject`, data);
};

export const listShippingRequests = (filters = {}, page = 0, size = 20) => {
  return api.get("/admin/shipping-requests", {
    params: {
      status: filters.status,
      page,
      size,
    },
  });
};

export const approveShippingRequest = (requestId) => {
  return api.post(`/admin/shipping-requests/${requestId}/approve`);
};

export const rejectShippingRequest = (requestId, data) => {
  return api.post(`/admin/shipping-requests/${requestId}/reject`, data);
};

export default {
  listItems,
  getItemDetail,
  approveItem,
  rejectItem,
  listShippingRequests,
  approveShippingRequest,
  rejectShippingRequest,
};
