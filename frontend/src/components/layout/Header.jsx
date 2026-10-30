
import {
  Menu,
  LogOut,
  ChevronRight,
  UserRound,
  ShieldCheck,
} from 'lucide-react'

function Header({ pageTitle, user, onLogout, onMenuClick }) {
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'

  const formattedRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'User'

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Hospital Management</span>
              <ChevronRight size={13} />
              <span className="truncate font-medium text-blue-600">
                {pageTitle || 'Dashboard'}
              </span>
            </div>

            <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
              {pageTitle || 'Hospital Management System'}
            </h2>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-sm font-bold text-white shadow-sm ring-4 ring-blue-50">
              {userInitial}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                {user?.name || 'User'}
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-teal-600" />
                <p className="text-xs text-slate-500">
                  {formattedRole}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100"
            title="Logout"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
