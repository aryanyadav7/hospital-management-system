
import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import SearchBar from '../../components/common/SearchBar'
import Loader from '../../components/common/Loader'
import Alert from '../../components/common/Alert'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

const EMPTY_FORM = {
  patient_id: '',
  doctor_id: '',
  department_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: '',
  notes: '',
  status: 'scheduled',
}

const STATUS_BADGES = {
  scheduled: 'info',
  confirmed: 'success',
  completed: 'default',
  cancelled: 'danger',
  no_show: 'warning',
}

function messageFrom(error) {
  if (error?.status === 401) {
    return 'Session expired. Please log in again.'
  }

  if (error?.status === 403) {
    return 'Only an authorized admin can manage appointments.'
  }

  const validationErrors = error?.data?.errors || error?.errors

  if (validationErrors) {
    return Object.values(validationErrors).flat().join(' ')
  }

  return error?.message || 'Something went wrong. Please try again.'
}

function unwrap(response) {
  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  return []
}

function getInputValue(value) {
  if (value && typeof value === 'object' && 'target' in value) {
    return value.target.value
  }

  return value ?? ''
}

function showDate(value) {
  if (!value) return '—'

  const [year, month, day] = String(value).slice(0, 10).split('-')

  return year && month && day
    ? `${day}/${month}/${year}`
    : String(value)
}

function showTime(value) {
  if (!value) return '—'

  const [hours, minutes] = String(value).split(':')
  const hour = Number(hours)

  if (!Number.isFinite(hour)) return String(value)

  return `${hour % 12 || 12}:${minutes || '00'} ${
    hour >= 12 ? 'PM' : 'AM'
  }`
}

function statusLabel(status) {
  return STATUSES.find((item) => item.value === status)?.label || status || 'Unknown'
}

function isActive(record) {
  return record.status !== false &&
    record.status !== 0 &&
    record.status !== '0' &&
    record.status !== 'inactive'
}

function getAppointmentNumber(appointment) {
  return appointment.appointment_number || `#${appointment.id}`
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

  const [search, setSearch] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [todayOnly, setTodayOnly] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState(null)

  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadReferenceData = useCallback(async () => {
    try {
      const [patientsResponse, doctorsResponse, departmentsResponse] =
        await Promise.all([
          api.get('/patients?per_page=100'),
          api.get('/doctors?per_page=100'),
          api.get('/departments?per_page=100'),
        ])

      setPatients(unwrap(patientsResponse))
      setDoctors(unwrap(doctorsResponse))
      setDepartments(unwrap(departmentsResponse))
    } catch (err) {
      setError(messageFrom(err))
    }
  }, [])

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '5',
      })

      if (search.trim()) params.set('search', search.trim())
      if (doctorFilter) params.set('doctor_id', doctorFilter)
      if (departmentFilter) params.set('department_id', departmentFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (dateFilter) params.set('date', dateFilter)

      const endpoint = todayOnly
        ? `/appointments/today?page=${page}`
        : `/appointments?${params.toString()}`

      const response = await api.get(endpoint)
      const data = response?.data

      setAppointments(
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []
      )

      setPagination({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total ?? 0,
      })
    } catch (err) {
      setAppointments([])
      setError(messageFrom(err))
    } finally {
      setLoading(false)
    }
  }, [
    page,
    search,
    doctorFilter,
    departmentFilter,
    statusFilter,
    dateFilter,
    todayOnly,
  ])

  useEffect(() => {
    loadReferenceData()
  }, [loadReferenceData])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  function changeFilter(setter, value) {
    setter(getInputValue(value))
    setPage(1)
  }

  function updateForm(event) {
    const { name, value } = event.target

    setForm((previous) => {
      const next = { ...previous, [name]: value }

      if (name === 'doctor_id' && value) {
        const doctor = doctors.find(
          (item) => String(item.id) === String(value)
        )

        if (doctor) {
          next.department_id = String(doctor.department_id)
        }
      }

      if (name === 'department_id' && previous.doctor_id) {
        const doctor = doctors.find(
          (item) => String(item.id) === String(previous.doctor_id)
        )

        if (
          doctor &&
          String(doctor.department_id) !== String(value)
        ) {
          next.doctor_id = ''
        }
      }

      return next
    })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  function createNew() {
    setError('')
    setSuccess('')
    setViewing(null)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function editAppointment(appointment) {
    setError('')
    setSuccess('')
    setViewing(null)
    setEditingId(appointment.id)

    setForm({
      patient_id: String(appointment.patient_id ?? ''),
      doctor_id: String(appointment.doctor_id ?? ''),
      department_id: String(appointment.department_id ?? ''),
      appointment_date: String(appointment.appointment_date || '').slice(0, 10),
      appointment_time: String(appointment.appointment_time || '').slice(0, 5),
      reason: appointment.reason || '',
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled',
    })

    setShowForm(true)
  }

  async function saveAppointment(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...form,
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        department_id: Number(form.department_id),
      }

      const response = editingId
        ? await api.put(`/appointments/${editingId}`, payload)
        : await api.post('/appointments', payload)

      setSuccess(response?.message || 'Appointment saved successfully.')
      closeForm()

      if (page !== 1) {
        setPage(1)
      } else {
        await loadAppointments()
      }
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setSaving(false)
    }
  }

  async function cancelAppointment() {
    if (!appointmentToCancel) return

    const appointment = appointmentToCancel

    setCancelingId(appointment.id)
    setError('')
    setSuccess('')

    try {
      const response = await api.delete(`/appointments/${appointment.id}`)

      setSuccess(response?.message || 'Appointment cancelled.')
      setAppointmentToCancel(null)

      await loadAppointments()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setCancelingId(null)
    }
  }

  async function updateStatus(appointment, status) {
    if (status === appointment.status) return

    setUpdatingStatusId(appointment.id)
    setError('')
    setSuccess('')

    try {
      const payload = {
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        department_id: appointment.department_id,
        appointment_date: String(appointment.appointment_date).slice(0, 10),
        appointment_time: String(appointment.appointment_time).slice(0, 5),
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        status,
      }

      const response = await api.put(
        `/appointments/${appointment.id}`,
        payload
      )

      setSuccess(response?.message || 'Appointment status updated.')
      await loadAppointments()
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setUpdatingStatusId(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setDoctorFilter('')
    setDepartmentFilter('')
    setStatusFilter('')
    setDateFilter('')
    setTodayOnly(false)
    setPage(1)
  }

  const eligibleDoctors = doctors.filter((doctor) => {
    const matchesDepartment = form.department_id
      ? String(doctor.department_id) === String(form.department_id)
      : true

    return matchesDepartment && isActive(doctor)
  })

  const patientOptions = [
    { value: '', label: 'Select patient' },
    ...patients.map((patient) => ({
      value: String(patient.id),
      label: `${patient.patient_id ? `${patient.patient_id} — ` : ''}${patient.name}`,
    })),
  ]

  const departmentOptions = [
    { value: '', label: 'Select department' },
    ...departments.filter(isActive).map((department) => ({
      value: String(department.id),
      label: department.name,
    })),
  ]

  const doctorOptions = [
    { value: '', label: 'Select doctor' },
    ...eligibleDoctors.map((doctor) => ({
      value: String(doctor.id),
      label: `${doctor.name}${doctor.specialization ? ` — ${doctor.specialization}` : ''}`,
    })),
  ]

  const formStatusOptions = STATUSES.map((status) => ({
    value: status.value,
    label: status.label,
  }))

  const columns = [
    {
      key: 'appointment',
      label: 'Appointment',
      render: (appointment) => (
        <div className="min-w-32">
          <p className="font-semibold text-gray-800">
            {getAppointmentNumber(appointment)}
          </p>
          <p className="mt-1 max-w-40 truncate text-xs text-gray-500">
            {appointment.reason || 'No reason'}
          </p>
        </div>
      ),
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (appointment) => (
        <div>
          <p className="font-medium text-gray-800">
            {appointment.patient?.name || `Patient #${appointment.patient_id}`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {appointment.patient?.patient_id || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'doctor',
      label: 'Doctor / Department',
      render: (appointment) => (
        <div>
          <p className="font-medium text-gray-800">
            {appointment.doctor?.name || `Doctor #${appointment.doctor_id}`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {appointment.department?.name ||
              `Department #${appointment.department_id}`}
          </p>
        </div>
      ),
    },
    {
      key: 'appointment_date',
      label: 'Date & time',
      render: (appointment) => (
        <div className="whitespace-nowrap text-sm text-gray-700">
          <p>{showDate(appointment.appointment_date)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {showTime(appointment.appointment_time)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (appointment) => (
        <select
          aria-label={`Status for ${getAppointmentNumber(appointment)}`}
          value={appointment.status || 'scheduled'}
          disabled={updatingStatusId === appointment.id}
          onChange={(event) => updateStatus(appointment, event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (appointment) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setViewing(appointment)}
          >
            View
          </Button>

          <Button
            variant="primary"
            onClick={() => editAppointment(appointment)}
          >
            Edit
          </Button>

          {appointment.status !== 'cancelled' && (
            <Button
              variant="danger"
              onClick={() => {
                setError('')
                setAppointmentToCancel(appointment)
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Appointment Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Book appointments and manage schedules.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={todayOnly ? 'primary' : 'secondary'}
            onClick={() => {
              setTodayOnly((previous) => !previous)
              setPage(1)
            }}
          >
            {todayOnly ? "Today's appointments ✓" : "Today's appointments"}
          </Button>

          <Button onClick={createNew}>
            + Book appointment
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title="Unable to complete the request"
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          type="success"
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {showForm && (
        <Card
          title={editingId ? 'Edit appointment' : 'Book a new appointment'}
          description="Enter the patient, doctor, and appointment details."
        >
          <form
            onSubmit={saveAppointment}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <Select
              label="Patient *"
              name="patient_id"
              value={form.patient_id}
              onChange={updateForm}
              options={patientOptions}
              required
              disabled={saving}
            />

            <Select
              label="Department *"
              name="department_id"
              value={form.department_id}
              onChange={updateForm}
              options={departmentOptions}
              required
              disabled={saving}
            />

            <div>
              <Select
                label="Doctor *"
                name="doctor_id"
                value={form.doctor_id}
                onChange={updateForm}
                options={doctorOptions}
                required
                disabled={saving}
              />

              {form.department_id && eligibleDoctors.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  No active doctors are assigned to this department.
                </p>
              )}
            </div>

            <Input
              label="Appointment date *"
              name="appointment_date"
              type="date"
              value={form.appointment_date}
              onChange={updateForm}
              required
              disabled={saving}
              min={new Date().toLocaleDateString('en-CA')}
            />

            <Input
              label="Appointment time *"
              name="appointment_time"
              type="time"
              value={form.appointment_time}
              onChange={updateForm}
              required
              disabled={saving}
            />

            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={updateForm}
              options={formStatusOptions}
              disabled={saving}
            />

            <div className="md:col-span-2 xl:col-span-3">
              <Input
                label="Reason for visit"
                name="reason"
                value={form.reason}
                onChange={updateForm}
                placeholder="e.g. General consultation"
                disabled={saving}
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label
                htmlFor="appointment-notes"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Notes
              </label>
              <textarea
                id="appointment-notes"
                name="notes"
                rows={3}
                maxLength={5000}
                value={form.notes}
                onChange={updateForm}
                placeholder="Optional notes"
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Create appointment'}
              </Button>

              <Button
                variant="secondary"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <SearchBar
              value={search}
              onChange={(value) => changeFilter(setSearch, value)}
              placeholder="Search appointment, patient, doctor..."
            />
          </div>

          <Select
            name="doctorFilter"
            value={doctorFilter}
            onChange={(value) => changeFilter(setDoctorFilter, value)}
            options={[
              { value: '', label: 'All doctors' },
              ...doctors.map((doctor) => ({
                value: String(doctor.id),
                label: doctor.name,
              })),
            ]}
          />

          <Select
            name="departmentFilter"
            value={departmentFilter}
            onChange={(value) => changeFilter(setDepartmentFilter, value)}
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((department) => ({
                value: String(department.id),
                label: department.name,
              })),
            ]}
          />

          <Select
            name="statusFilter"
            value={statusFilter}
            onChange={(value) => changeFilter(setStatusFilter, value)}
            options={[
              { value: '', label: 'All statuses' },
              ...STATUSES,
            ]}
          />

          <Input
            name="dateFilter"
            type="date"
            value={dateFilter}
            onChange={(value) => changeFilter(setDateFilter, value)}
            className="min-w-0"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            {todayOnly
              ? "Today's appointments"
              : `${appointments.length} shown · ${pagination.total} total`}
          </p>

          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-8">
            <Loader message="Loading appointments..." />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={appointments}
              rowKey="id"
              emptyMessage="No appointments found. Change your filters or book an appointment."
            />

            {pagination.last_page > 1 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <Pagination
                  currentPage={pagination.current_page}
                  totalPages={pagination.last_page}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Appointment details"
        size="large"
      >
        {viewing && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500">Appointment number</p>
              <p className="mt-1 font-semibold text-gray-800">
                {getAppointmentNumber(viewing)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                [
                  'Patient',
                  viewing.patient?.name || `Patient #${viewing.patient_id}`,
                ],
                ['Patient ID', viewing.patient?.patient_id || '—'],
                [
                  'Doctor',
                  viewing.doctor?.name || `Doctor #${viewing.doctor_id}`,
                ],
                [
                  'Department',
                  viewing.department?.name ||
                    `Department #${viewing.department_id}`,
                ],
                ['Date', showDate(viewing.appointment_date)],
                ['Time', showTime(viewing.appointment_time)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-gray-50 p-3"
                >
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 font-medium text-gray-800">{value}</p>
                </div>
              ))}

              <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-2">
                  <Badge variant={STATUS_BADGES[viewing.status] || 'default'}>
                    {statusLabel(viewing.status)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                <p className="text-sm text-gray-500">Reason for visit</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-800">
                  {viewing.reason || '—'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-800">
                  {viewing.notes || '—'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>

              <Button
                onClick={() => editAppointment(viewing)}
              >
                Edit appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(appointmentToCancel)}
        onClose={() => {
          if (!cancelingId) setAppointmentToCancel(null)
        }}
        onConfirm={cancelAppointment}
        title="Cancel appointment?"
        message={
          appointmentToCancel
            ? `Are you sure you want to cancel appointment ${getAppointmentNumber(appointmentToCancel)}? The record will be retained for history.`
            : ''
        }
        confirmText="Cancel appointment"
        cancelText="Keep appointment"
        loading={Boolean(cancelingId)}
      />
    </div>
  )
}
