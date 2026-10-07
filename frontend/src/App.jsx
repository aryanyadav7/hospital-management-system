import { useEffect, useState } from 'react'
import Departments from './Departments'
import Login from './Login'
import Register from './Register'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  const [dashboardData, setDashboardData] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  const [user, setUser] = useState(null)

  /*
   * Restore login session after page reload
   */
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)

        setUser(parsedUser)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Unable to restore user session:', error)

        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  /*
   * Fetch dashboard data after login
   */
  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const fetchDashboard = async () => {
      try {
        setDashboardLoading(true)

        const token = localStorage.getItem('token')

        const response = await fetch(
          'http://127.0.0.1:8000/api/v1/dashboard',
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        console.log('Dashboard response:', data)

        if (data.success) {
          setDashboardData(data.data)
          setUser(data.data.user)
        }
      } catch (error) {
        console.error('Dashboard error:', error)
      } finally {
        setDashboardLoading(false)
      }
    }

    fetchDashboard()
  }, [isLoggedIn])

  /*
   * Login
   */
  const handleLogin = () => {
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Unable to read stored user:', error)
      }
    }

    setCurrentPage('dashboard')
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')

      if (token) {
        await fetch(
          'http://127.0.0.1:8000/api/v1/auth/logout',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      setUser(null)
      setDashboardData(null)
      setIsLoggedIn(false)
      setCurrentPage('dashboard')
    }
  }

  /*
   * Show login page when user is not logged in
   */
  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <Register
          onRegister={() => {
            const storedUser = localStorage.getItem('user')

            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser))
              } catch (error) {
                console.error('Unable to read stored user:', error)
              }
            }

            setShowRegister(false)
            setIsLoggedIn(true)
          }}
          onLogin={() => setShowRegister(false)}
        />
      )
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setShowRegister(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white min-h-screen">

        {/* Logo */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">
            HMS
          </h1>

          <p className="text-blue-200 text-sm mt-1">
            Hospital Management
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-6">

          {/* Dashboard */}
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`block w-full text-left px-6 py-3 ${
              currentPage === 'dashboard'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Dashboard
          </button>

          {/* Departments */}
          <button
            onClick={() => setCurrentPage('departments')}
            className={`block w-full text-left px-6 py-3 ${
              currentPage === 'departments'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Departments
          </button>

          {/* Future Modules */}
          <button
            className="block w-full text-left px-6 py-3 hover:bg-blue-800"
          >
            Doctors
          </button>

          <button
            className="block w-full text-left px-6 py-3 hover:bg-blue-800"
          >
            Patients
          </button>

          <button
            className="block w-full text-left px-6 py-3 hover:bg-blue-800"
          >
            Appointments
          </button>

        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">

        {/* Top Header */}
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {currentPage === 'dashboard'
                ? 'Dashboard'
                : currentPage === 'departments'
                  ? 'Departments'
                  : 'Hospital Management System'}
            </h2>

            <p className="text-sm text-gray-500">
              Welcome to Hospital Management System
            </p>
          </div>

          {/* User Information */}
          <div className="flex items-center gap-4">

            {/* User Information */}
            <div className="flex items-center gap-3">

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* Name and Role */}
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {user?.name || 'User'}
                </p>

                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'User'}
                </p>
              </div>

            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>

          </div>

        </header>

        {/* Page Content */}
        <main className="p-8">

          {/* Dashboard */}
          {currentPage === 'dashboard' && (

            <div>

              {/* Role Based Dashboard Heading */}
              <div className="mb-6">

                <h3 className="text-2xl font-bold text-gray-800">
                  {user?.role === 'admin'
                    ? 'Admin Dashboard'
                    : user?.role === 'doctor'
                      ? 'Doctor Dashboard'
                      : user?.role === 'receptionist'
                        ? 'Receptionist Dashboard'
                        : 'Dashboard'}
                </h3>

                <p className="text-gray-500 mt-1">
                  Welcome, {user?.name || 'User'}
                </p>

              </div>

              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Departments */}
                <div className="bg-white rounded-xl shadow-sm p-6">

                  <p className="text-sm text-gray-500">
                    Total Departments
                  </p>

                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts.departments ?? 0}
                  </h3>

                </div>

                {/* Doctors */}
                <div className="bg-white rounded-xl shadow-sm p-6">

                  <p className="text-sm text-gray-500">
                    Total Doctors
                  </p>

                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts.doctors ?? 0}
                  </h3>

                </div>

                {/* Patients */}
                <div className="bg-white rounded-xl shadow-sm p-6">

                  <p className="text-sm text-gray-500">
                    Total Patients
                  </p>

                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts.patients ?? 0}
                  </h3>

                </div>

                {/* Appointments */}
                <div className="bg-white rounded-xl shadow-sm p-6">

                  <p className="text-sm text-gray-500">
                    Today's Appointments
                  </p>

                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts.appointments ?? 0}
                  </h3>

                </div>

              </div>

            </div>

          )}

          {/* Departments */}
          {currentPage === 'departments' && (
            <Departments />
          )}

        </main>

      </div>

    </div>
  )
}

export default App