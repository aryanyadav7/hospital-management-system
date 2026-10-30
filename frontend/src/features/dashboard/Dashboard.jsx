import {
  Building2,
  Stethoscope,
  Users,
  CalendarDays,
  Activity,
  ArrowUpRight,
  Clock3,
  UserRound,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react'

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    color: '#3B82F6',
    badge: 'bg-blue-50 text-blue-700',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#16A34A',
    badge: 'bg-green-50 text-green-700',
  },
  completed: {
    label: 'Completed',
    color: '#0D9488',
    badge: 'bg-teal-50 text-teal-700',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF4444',
    badge: 'bg-red-50 text-red-700',
  },
  no_show: {
    label: 'No Show',
    color: '#F59E0B',
    badge: 'bg-amber-50 text-amber-700',
  },
}

const STAT_CARDS = [
  {
    key: 'departments',
    label: 'Total Departments',
    icon: Building2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    key: 'doctors',
    label: 'Total Doctors',
    icon: Stethoscope,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    key: 'patients',
    label: 'Total Patients',
    icon: Users,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  {
    key: 'appointments',
    label: "Today's Appointments",
    icon: CalendarDays,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
]

function formatDate(dateString) {
  if (!dateString) return '—'

  // Use the date portion directly to avoid timezone date shifts.
  const datePart = String(dateString).slice(0, 10)
  const [year, month, day] = datePart.split('-')

  if (!year || !month || !day) return '—'

  return `${day}/${month}/${year}`
}

function formatTime(timeString) {
  if (!timeString) return '—'

  const [hours, minutes] = String(timeString).split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badge: 'bg-gray-100 text-gray-600',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}
    >
      {config.label}
    </span>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 rounded-full bg-gray-100 p-4">
        <ClipboardList size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  )
}

function AppointmentStatusChart({ statusCounts = {} }) {
  const statuses = Object.keys(STATUS_CONFIG).map((key) => ({
    key,
    ...STATUS_CONFIG[key],
    total: Number(statusCounts[key] || 0),
  }))

  const total = statuses.reduce((sum, item) => sum + item.total, 0)

  let currentAngle = 0

  const gradient = statuses
    .map((item) => {
      const percentage = total > 0 ? (item.total / total) * 100 : 0
      const start = currentAngle
      currentAngle += percentage

      return `${item.color} ${start}% ${currentAngle}%`
    })
    .join(', ')

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">
            Appointment Status
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Overall appointment breakdown
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Activity size={19} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-around">
        <div className="relative h-40 w-40 shrink-0">
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                total > 0
                  ? `conic-gradient(${gradient})`
                  : '#E5E7EB',
            }}
          />

          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-gray-800">
              {total}
            </span>
            <span className="text-xs text-gray-400">Total</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          {statuses.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">
                  {item.label}
                </span>
              </div>

              <span className="text-sm font-semibold text-gray-800">
                {item.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {total === 0 && (
        <p className="mt-5 text-center text-xs text-gray-400">
          No appointment records available yet.
        </p>
      )}
    </div>
  )
}

function MonthlyAppointmentsChart({ monthlyData = [] }) {
  const maxValue = Math.max(
    ...monthlyData.map((item) => Number(item.total || 0)),
    1
  )

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">
            Appointment Overview
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Monthly appointments · Last 6 months
          </p>
        </div>

        <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
          <CalendarCheck size={19} />
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <EmptyState message="No monthly appointment data available." />
      ) : (
        <div className="pt-2">
          <div className="flex h-48 items-end justify-around gap-3 border-b border-gray-100 px-2">
            {monthlyData.map((item, index) => {
              const value = Number(item.total || 0)
              const height =
                value > 0 ? Math.max((value / maxValue) * 100, 5) : 2

              return (
                <div
                  key={`${item.month}-${index}`}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold text-gray-600">
                    {value}
                  </span>

                  <div
                    className="w-full max-w-10 rounded-t-lg bg-blue-500 transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                    title={`${item.month}: ${value} appointments`}
                  />

                  <span className="mb-2 text-xs text-gray-400">
                    {item.month}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-400">
              Total appointments per month
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Dashboard({
  user,
  dashboardData,
  dashboardLoading,
}) {
  const counts = dashboardData?.counts || {}
  const todayAppointments = dashboardData?.today_appointments || []
  const recentPatients = dashboardData?.recent_patients || []

  const statusCounts =
    dashboardData?.appointment_status_counts || {}

  const monthlyAppointments =
    dashboardData?.monthly_appointments || []

  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600">
            {today}
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-gray-800">
            Welcome back, {firstName}!
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Here is what's happening in your hospital today.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:self-auto">
          <div className="rounded-lg bg-green-50 p-2 text-green-600">
            <Activity size={18} />
          </div>

          <div>
            <p className="text-xs text-gray-400">System status</p>
            <p className="text-sm font-semibold text-gray-700">
              Dashboard active
            </p>
          </div>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.key}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${card.iconBg}`}>
                  <Icon size={22} className={card.iconColor} />
                </div>

                <ArrowUpRight size={18} className="text-gray-300" />
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-500">
                  {card.label}
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-800">
                  {dashboardLoading ? (
                    <span className="inline-block h-9 w-14 animate-pulse rounded bg-gray-100" />
                  ) : (
                    Number(counts[card.key] || 0).toLocaleString('en-IN')
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AppointmentStatusChart statusCounts={statusCounts} />

        <MonthlyAppointmentsChart
          monthlyData={monthlyAppointments}
        />
      </div>

      {/* Today's appointments */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-gray-800">
              Today's Appointments
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Your next scheduled patient visits
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
            <Clock3 size={15} />
            Today's schedule
          </div>
        </div>

        {dashboardLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">
            Loading appointments...
          </div>
        ) : todayAppointments.length === 0 ? (
          <EmptyState message="No appointments scheduled for today." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-semibold">Appointment</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {todayAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-semibold text-blue-600">
                        {appointment.appointment_number || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-700">
                        {appointment.patient?.name || '—'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {appointment.patient?.patient_id || ''}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">
                        {appointment.doctor?.name || '—'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {appointment.doctor?.specialization || ''}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {appointment.department?.name || '—'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatTime(appointment.appointment_time)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent patients */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="text-base font-bold text-gray-800">
              Recent Patients
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Latest patient registrations
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-2 text-green-600">
            <UserRound size={19} />
          </div>
        </div>

        {dashboardLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">
            Loading patients...
          </div>
        ) : recentPatients.length === 0 ? (
          <EmptyState message="No patients registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-semibold">Patient ID</th>
                  <th className="px-5 py-3 font-semibold">Patient Name</th>
                  <th className="px-5 py-3 font-semibold">Gender</th>
                  <th className="px-5 py-3 font-semibold">
                    Registration Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-blue-600">
                      {patient.patient_id || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-gray-700">
                      {patient.name || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm capitalize text-gray-600">
                      {patient.gender || '—'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(patient.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer information */}
      <div className="flex flex-col justify-between gap-2 rounded-xl bg-blue-50/70 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={17} className="text-blue-600" />
          <p className="text-sm font-medium text-gray-600">
            Hospital management overview
          </p>
        </div>

        <p className="text-xs text-gray-400">
          Logged in as {user?.role || 'user'}
        </p>
      </div>
    </div>
  )
}

export default Dashboard