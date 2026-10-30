
import { useState } from 'react'
import { X } from 'lucide-react'

import Sidebar from './Sidebar'
import Header from './Header'

function MainLayout({
  currentPage,
  setCurrentPage,
  user,
  pageTitle,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function closeSidebar() {
    setSidebarOpen(false)
  }

  function toggleSidebar() {
    setSidebarOpen((previous) => !previous)
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close navigation backdrop"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Content Area */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">

        {/* Header */}
        <Header
          pageTitle={pageTitle}
          user={user}
          onLogout={onLogout}
          onMenuClick={toggleSidebar}
        />

        {/* Page Content */}
        <main className="w-full flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white px-6 py-4">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} MediCare Hospital Management System.
            All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  )
}

export default MainLayout
