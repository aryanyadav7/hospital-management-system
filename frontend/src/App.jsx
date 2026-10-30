
import { useEffect, useState } from 'react'

import api from './services/api'

// Layout
import MainLayout from './components/layout/MainLayout'

// Authentication
import Login from './features/auth/Login'
import Register from './features/auth/Register'

// Features
import Departments from './features/departments/Departments'
import Doctors from './features/doctors/Doctors'
import Patients from './features/patients/Patients'
import Appointments from './features/appointments/Appointments'
import HospitalSettings from './features/settings/HospitalSettings'
import Dashboard from './features/dashboard/Dashboard'

// Other pages
import Profile from './Profile'

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
   * Page titles.
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

  /*
   * Main application layout and page rendering.
   */
  return (
    <MainLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      user={user}
      pageTitle={pageTitles[currentPage]}
      onLogout={handleLogout}
    >
      {/* Dashboard */}
      {currentPage === 'dashboard' && (
        <Dashboard
          user={user}
          dashboardData={dashboardData}
          dashboardLoading={dashboardLoading}
        />
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

    </MainLayout>
  )
}

export default App
