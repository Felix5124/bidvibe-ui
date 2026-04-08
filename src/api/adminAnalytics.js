// Admin Analytics APIs
// GET /api/admin/analytics/overview - High-level admin dashboard metrics
// GET /api/admin/analytics/revenue - Revenue metrics over a date range
// GET /api/admin/analytics/auctions - Auction statistics
// GET /api/admin/analytics/market - Market statistics

import api from './baseApi'

/**
 * Get overview metrics for admin dashboard
 */
export const getOverview = () => {
  return api.get('/admin/analytics/overview')
}

/**
 * Get revenue metrics in a date range
 * @param {Object} params - {from: 'YYYY-MM-DD', to: 'YYYY-MM-DD'}
 */
export const getRevenue = (params = {}) => {
  return api.get('/admin/analytics/revenue', { params })
}

/**
 * Get auction-related statistics
 */
export const getAuctionStats = () => {
  return api.get('/admin/analytics/auctions')
}

/**
 * Get market-related statistics
 */
export const getMarketStats = () => {
  return api.get('/admin/analytics/market')
}

export default {
  getOverview,
  getRevenue,
  getAuctionStats,
  getMarketStats,
}