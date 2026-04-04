// Central export for all API modules
// Import and use individual API modules as needed

// Base
export { default as api } from './baseApi'

// Authentication
export * as authAPI from './auth'

// User & Profile
export * as usersAPI from './users'

// Auction Sessions
export * as sessionsAPI from './sessions'

// Auctions & Bidding
export * as auctionsAPI from './auctions'

// Items
export * as itemsAPI from './items'

// Market Listings
export * as marketAPI from './market'

// Wallet & Transactions
export * as walletAPI from './wallet'

// Notifications
export * as notificationsAPI from './notifications'

// Ratings
export * as ratingsAPI from './ratings'

// Analytics
export * as analyticsAPI from './analytics'

// Admin APIs
export * as adminUsersAPI from './adminUsers'
export * as adminItemsAPI from './adminItems'
export * as adminSessionsAPI from './adminSessions'
export * as adminTransactionsAPI from './adminTransactions'
export * as adminMarketAPI from './adminMarket'
export * as adminAnalyticsAPI from './adminAnalytics'
