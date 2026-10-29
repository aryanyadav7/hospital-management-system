
import { useEffect, useState } from 'react'

import api from './services/api'

import Departments from './Departments'
import Doctors from './Doctors'
import Patients from './Patients'
import Appointments from './Appointments'
import Profile from './Profile'
import HospitalSettings from './HospitalSettings'
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
   * Restore login session after page reload.
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

    setDashboardLoading(false)
  }, [])

  /*
   * Fetch dashboard data after login.
   * Uses the shared API service.
   */
  useEffect(() => {
    if (!isLoggedIn) {
      setDashboardLoading(false)
      return
    }

    let cancelled = false

    async function fetchDashboard() {
      setDashboardLoading(true)

      try {
        const response = await api.get('/dashboard')

        if (cancelled) return

        if (response?.success) {
          setDashboardData(response.data)

          if (response.data?.user) {
            setUser(response.data.user)
            localStorage.setItem(
              'user',
              JSON.stringify(response.data.user)
            )
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Dashboard error:', error)
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  /*
   * Login.
   */
  function handleLogin() {
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

  /*
   * Logout.
   * The local session is cleared even if the API request fails.
   */
  async function handleLogout() {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout', {})
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      setUser(null)
      setDashboardData(null)
      setDashboardLoading(false)
      setIsLoggedIn(false)
      setShowRegister(false)
      setCurrentPage('dashboard')
    }
  }

  /*
   * Registration completed.
   */
  function handleRegister() {
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Unable to read stored user:', error)
      }
    }

    setShowRegister(false)
    setCurrentPage('dashboard')
    setIsLoggedIn(true)
  }

  /*
   * Page title for the top header.
   */
  const pageTitles = {
    dashboard: 'Dashboard',
    departments: 'Departments',
    doctors: 'Doctors',
    patients: 'Patients',
    appointments: 'Appointments',
    'hospital-settings': 'Hospital Settings',
    profile: 'My Profile',
  }

  /*
   * Show login or registration when logged out.
   */
  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
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
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="min-h-screen w-64 shrink-0 bg-blue-900 text-white">

        {/* Logo */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">
            HMS
          </h1>

          <p className="mt-1 text-sm text-blue-200">
            Hospital Management
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1">

          <button
            type="button"
            onClick={() => setCurrentPage('dashboard')}
            className={`block w-full px-6 py-3 text-left ${
              currentPage === 'dashboard'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('departments')}
            className={`block w-full px-6 py-3 text-left ${
              currentPage === 'departments'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Departments
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('doctors')}
            className={`block w-full px-6 py-3 text-left ${
              currentPage === 'doctors'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Doctors
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('patients')}
            className={`block w-full px-6 py-3 text-left ${
              currentPage === 'patients'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Patients
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('appointments')}
            className={`block w-full px-6 py-3 text-left ${
              currentPage === 'appointments'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            Appointments
          </button>

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setCurrentPage('hospital-settings')}
              className={`block w-full px-6 py-3 text-left ${
                currentPage === 'hospital-settings'
                  ? 'bg-blue-800'
                  : 'hover:bg-blue-800'
              }`}
            >
              Hospital Settings
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentPage('profile')}
            className={`block w-full px-6 py-3 text-left ${
              currentPage === 'profile'
                ? 'bg-blue-800'
                : 'hover:bg-blue-800'
            }`}
          >
            My Profile
          </button>

        </nav>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">

        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-8 py-4 shadow-sm">

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {pageTitles[currentPage] || 'Hospital Management System'}
            </h2>

            <p className="text-sm text-gray-500">
              Welcome to Hospital Management System
            </p>
          </div>

          {/* User Information */}
          <div className="flex items-center gap-4">

            <div className="flex items-center gap-3">

              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* Name and Role */}
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {user?.name || 'User'}
                </p>

                <p className="text-xs capitalize text-gray-500">
                  {user?.role || 'User'}
                </p>
              </div>

            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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

              {/* Dashboard Heading */}
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

                <p className="mt-1 text-gray-500">
                  Welcome, {user?.name || 'User'}
                </p>
              </div>

              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

                {/* Departments */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Total Departments
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-800">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts?.departments ?? 0}
                  </h3>
                </div>

                {/* Doctors */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Total Doctors
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-800">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts?.doctors ?? 0}
                  </h3>
                </div>

                {/* Patients */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Total Patients
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-800">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts?.patients ?? 0}
                  </h3>
                </div>

                {/* Appointments */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Today's Appointments
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-800">
                    {dashboardLoading
                      ? '...'
                      : dashboardData?.counts?.appointments ?? 0}
                  </h3>
                </div>

              </div>
            </div>
          )}

          {/* Departments */}
          {currentPage === 'departments' && <Departments />}

          {/* Doctors */}
          {currentPage === 'doctors' && <Doctors />}

          {/* Patients */}
          {currentPage === 'patients' && <Patients />}

          {/* Appointments */}
          {currentPage === 'appointments' && <Appointments />}

          {/* Hospital Settings */}
          {currentPage === 'hospital-settings' && user?.role === 'admin' && (
            <HospitalSettings />
          )}

          {/* Profile */}
          {currentPage === 'profile' && <Profile />}

        </main>
      </div>
    </div>
  )
}

export default App
