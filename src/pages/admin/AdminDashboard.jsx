import { useAuthStore } from '../../store/authStore'

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Hello, {user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Total Users</h2>
            <p className="text-3xl mt-2">-</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Pending Items</h2>
            <p className="text-3xl mt-2">-</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Revenue</h2>
            <p className="text-3xl mt-2">-</p>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-gray-600">Admin functionality will be implemented later.</p>
        </div>
      </main>
    </div>
  )
}