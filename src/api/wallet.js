// Wallet & Transaction APIs
// GET  /api/wallet - Get wallet balance
// POST /api/wallet/deposit - Request deposit
// POST /api/wallet/withdraw - Request withdraw
// GET  /api/wallet/transactions - Get transaction history (paginated & filterable)

import api from './baseApi'

/**
 * Get user's wallet balance
 */
export const getBalance = () => {
  return api.get('/wallet')
}

/**
 * Request a deposit (add funds)
 * @param {Object} data - {amount, paymentMethod, ...}
 */
export const requestDeposit = (data) => {
  return api.post('/wallet/deposit', data)
}

/**
 * Request a withdrawal (withdraw funds)
 * @param {Object} data - {amount, bankAccount, ...}
 */
export const requestWithdraw = (data) => {
  return api.post('/wallet/withdraw', data)
}

/**
 * Get transaction history (paginated & filterable)
 * @param {Object} filters - {type: 'DEPOSIT'|'WITHDRAW', status: 'PENDING'|'COMPLETED'|'FAILED'}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const getTransactionHistory = (filters = {}, page = 0, size = 20) => {
  return api.get('/wallet/transactions', {
    params: {
      type: filters.type,
      status: filters.status,
      page,
      size,
    },
  })
}

export default {
  getBalance,
  requestDeposit,
  requestWithdraw,
  getTransactionHistory,
}
