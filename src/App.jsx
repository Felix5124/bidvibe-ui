import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import ScrollToTop from './components/ScrollToTop'
import ToastContainer from './components/Toast'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import { useNotificationSubscription } from './hooks/useNotificationSubscription'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import BannedPage from './pages/BannedPage'
import HomePage from './pages/HomePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import InventoryPage from './pages/InventoryPage'
import ItemDetailPage from './pages/ItemDetailPage'
import MyProfilePage from './pages/MyProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import AuctionRoomPage from './pages/AuctionRoomPage'
import MarketPage from './pages/MarketPage'
import MarketDetailPage from './pages/MarketDetailPage'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import ItemSubmitPage from './pages/ItemSubmitPage'
import WatchlistPage from './pages/WatchlistPage'
import WalletPage from './pages/WalletPage'
import NotificationsPage from './pages/NotificationsPage'
import TransactionRatingPage from './pages/TransactionRatingPage'

function NotificationListener() {
  useNotificationSubscription()
  return null
}

function App() {
  const { fetchUserProfile, isLoading, user } = useAuthStore()
  const [hasTriedInitialAuth, setHasTriedInitialAuth] = useState(false)

  // Try to fetch user profile once on mount if we have a token
  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('sb_jwt') || sessionStorage.getItem('authToken')
      
      // Check if user is already marked as banned in sessionStorage
      const userStr = sessionStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.isBanned) {
            // User is already banned, skip API call
            console.debug('User is banned, skipping initial auth')
            setHasTriedInitialAuth(true)
            return
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
      
      if (token && !hasTriedInitialAuth) {
        try {
          await fetchUserProfile()
        } catch (error) {
          // Silently fail - ProtectedRoute will handle it
          console.debug('Initial auth failed:', error)
        }
      }
      setHasTriedInitialAuth(true)
    }

    initAuth()
  }, [fetchUserProfile, hasTriedInitialAuth])

  // Show loading only during initial auth attempt
  if (isLoading && !hasTriedInitialAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-700">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <ToastContainer />
          {user && <NotificationListener />}
          <Routes>
          <Route path="/banned" element={<BannedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          <Route element={<AppLayout />}>

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:id"
            element={
              <ProtectedRoute>
                <ItemDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/profile"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/:id"
            element={
              <ProtectedRoute>
                <AuctionRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:sessionId/room"
            element={
              <ProtectedRoute>
                <AuctionRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market"
            element={
              <ProtectedRoute>
                <MarketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market/:listingId"
            element={
              <ProtectedRoute>
                <MarketDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <ProtectedRoute>
                <SessionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/submit"
            element={
              <ProtectedRoute>
                <ItemSubmitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/watchlist"
            element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/:id/rate"
            element={
              <ProtectedRoute>
                <TransactionRatingPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch‑all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </ToastProvider>
  )
}

export default App
