import { useState } from 'react'
import Login from './Login'
import Departments from './Departments'



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold">
            HMS
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Hospital Management
          </p>
        </div>

        <nav className="mt-6">
          <a
            href="#"
            className="block px-6 py-3 bg-blue-800"
          >
            Dashboard
          </a>

          <button
            onClick={() => setCurrentPage('departments')}
            className="block w-full text-left px-6 py-3 hover:bg-blue-800"
          >
            Departments
          </button>

          <a
            href="#"
            className="block px-6 py-3 hover:bg-blue-800"
          >
            Doctors
          </a>

          <a
            href="#"
            className="block px-6 py-3 hover:bg-blue-800"
          >
            Patients
          </a>

          <a
            href="#"
            className="block px-6 py-3 hover:bg-blue-800"
          >
            Appointments
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">

        {/* Top Header */}
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              Welcome to Hospital Management System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              A
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                Admin
              </p>
              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {currentPage === 'dashboard' && (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Total Departments
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                1
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Total Doctors
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                0
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Total Patients
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                0
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Today's Appointments
              </p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                0
              </h3>
            </div>

          </div>

         )}

          {currentPage === 'departments' && (
            <Departments />
          )}
        </main>

      </div>

    </div>
  )
}

export default App