import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'
import AppFooter from './AppFooter'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />
      <Outlet />
      <AppFooter />
    </div>
  )
}
