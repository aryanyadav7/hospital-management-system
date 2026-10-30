
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  Users,
  CalendarDays,
  Settings,
  UserRound,
  Activity,
  X,
} from 'lucide-react'

function Sidebar({
  currentPage,
  setCurrentPage,
  user,
  isOpen,
  onClose,
}) {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Building2,
    },
    {
      id: 'doctors',
      label: 'Doctors',
      icon: Stethoscope,
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarDays,
    },
  ]

  if (user?.role === 'admin') {
    navigationItems.push({
      id: 'hospital-settings',
      label: 'Hospital Settings',
      icon: Settings,
    })
  }

  navigationItems.push({
    id: 'profile',
    label: 'My Profile',
    icon: UserRound,
  })

  function handleNavigation(page) {
    setCurrentPage(page)
    onClose?.()
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col
        border-r border-white/10 bg-[#101B35] text-white
        shadow-2xl transition-transform duration-300
        lg:sticky lg:top-0 lg:z-30 lg:h-screen
        lg:translate-x-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Brand */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
            <Activity size={25} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-wide">
              MediCare
            </h1>
            <p className="text-[11px] font-medium tracking-[0.18em] text-blue-300">
              HOSPITAL MANAGEMENT
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X size={21} />
        </button>
      </div>

      {/* Hospital Information */}
      <div className="mx-4 mt-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
            <Building2 size={21} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Hospital Portal
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-7">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Main Menu
        </p>

        <div className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.id)}
                className={`
                  group relative flex w-full items-center gap-3
                  rounded-xl px-3.5 py-3 text-left text-sm
                  font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                  }
                `}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 transition group-hover:text-blue-300'
                  }
                />

                <span className="flex-1">{item.label}</span>

                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-white/10 p-5">
        <div className="rounded-xl bg-gradient-to-br from-blue-600/20 to-teal-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-teal-300">
            <Activity size={16} />
            <span className="text-xs font-semibold">System Status</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300">
              Management portal active
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          MediCare HMS · v1.0
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
