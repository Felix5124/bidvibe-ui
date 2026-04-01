// Admin Transaction Management APIs
// GET  /api/admin/transactions - List all transactions (paginated, filterable)
// GET  /api/admin/transactions/pending - Get pending transactions
// POST /api/admin/transactions/{id}/approve-deposit - Approve deposit
// POST /api/admin/transactions/{id}/reject-deposit - Reject deposit
// POST /api/admin/transactions/{id}/approve-withdraw - Approve withdrawal
// POST /api/admin/transactions/{id}/reject-withdraw - Reject withdrawal
// POST /api/admin/transactions/approve - Legacy bulk approve/reject by body
// POST /api/admin/transactions/{id}/approve - Approve transaction
// POST /api/admin/transactions/{id}/reject - Reject transaction

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

/**
 * Legacy bulk transaction processing endpoint
 * @param {string} transactionId - Transaction ID
 * @param {string} newStatus - COMPLETED | CANCELLED
 * @param {string} adminNote - Optional admin note
 */
export const processTransaction = (transactionId, newStatus, adminNote) => {
  return api.post('/admin/transactions/approve', {
    transactionId,
    newStatus,
    adminNote,
  })
}

/**
 * Generic approve transaction
 * @param {string} transactionId - Transaction ID
 */
export const approveTransaction = (transactionId) => {
  return api.post(`/admin/transactions/${transactionId}/approve`)
}

/**
 * Generic reject transaction
 * @param {string} transactionId - Transaction ID
 */
export const rejectTransaction = (transactionId) => {
  return api.post(`/admin/transactions/${transactionId}/reject`)
}

export default {
  listTransactions,
  getPendingTransactions,
  approveDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
  processTransaction,
  approveTransaction,
  rejectTransaction,
}
