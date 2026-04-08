// Admin Transaction Management APIs
// GET  /api/admin/transactions - List all transactions (paginated, filterable)
// GET  /api/admin/transactions/pending - Get pending transactions
// POST /api/admin/transactions/{id}/approve-deposit - Approve deposit
// POST /api/admin/transactions/{id}/reject-deposit - Reject deposit
// POST /api/admin/transactions/{id}/approve-withdraw - Approve withdrawal
// POST /api/admin/transactions/{id}/reject-withdraw - Reject withdrawal
// Admin chỉ dùng các endpoint duyệt/từ chối nạp-rút chuyên biệt.

import api from './baseApi'

/**
 * List all transactions (paginated, filterable)
 * @param {Object} filters - {type: 'DEPOSIT'|'WITHDRAW', status: 'PENDING'|'COMPLETED'|'FAILED'|...}
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 */
export const listTransactions = (filters = {}, page = 0, size = 20) => {
  return api.get('/admin/transactions', {
    params: {
      type: filters.type,
      status: filters.status,
      page,
      size,
    },
  })
}

/**
 * Get pending transactions (DEPOSIT + WITHDRAW)
 */
export const getPendingTransactions = () => {
  return api.get('/admin/transactions/pending')
}

/**
 * Approve a deposit transaction
 * @param {string} transactionId - Transaction ID
 */
export const approveDeposit = (transactionId) => {
  return api.post(`/admin/transactions/${transactionId}/approve-deposit`)
}

/**
 * Reject a deposit transaction
 * @param {string} transactionId - Transaction ID
 */
export const rejectDeposit = (transactionId) => {
  return api.post(`/admin/transactions/${transactionId}/reject-deposit`)
}

/**
 * Approve a withdrawal transaction
 * @param {string} transactionId - Transaction ID
 */
export const approveWithdraw = (transactionId) => {
  return api.post(`/admin/transactions/${transactionId}/approve-withdraw`)
}

/**
 * Reject a withdrawal transaction
 * @param {string} transactionId - Transaction ID
 */
export const rejectWithdraw = (transactionId) => {
  return api.post(`/admin/transactions/${transactionId}/reject-withdraw`)
}

export default {
  listTransactions,
  getPendingTransactions,
  approveDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
}
