import { useCallback, useEffect, useState } from 'react'

const API = 'http://127.0.0.1:8000/api/v1'
const STATUSES = [
  ['scheduled', 'Scheduled'],
  ['confirmed', 'Confirmed'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['no_show', 'No Show'],
]
const EMPTY = {
  patient_id: '', doctor_id: '', department_id: '',
  appointment_date: '', appointment_time: '',
  reason: '', notes: '', status: 'scheduled',
}

function tokenHeaders() {
  const token = localStorage.getItem('token')
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function messageFrom(error) {
  if (error?.errors) return Object.values(error.errors).flat().join(' ')
  return error?.message || 'Something went wrong. Please try again.'
}

function unwrap(response) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  return []
}

function showDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function showTime(value) {
  if (!value) return '—'
  const [h, m] = String(value).split(':')
  const hour = Number(h)
  if (!Number.isFinite(hour)) return value
  return `${hour % 12 || 12}:${m || '00'} ${hour >= 12 ? 'PM' : 'AM'}`
}

function badgeClass(status) {
  return {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-amber-100 text-amber-800',
  }[status] || 'bg-gray-100 text-gray-800'
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [todayOnly, setTodayOnly] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const request = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { ...tokenHeaders(), ...(options.headers || {}) },
    })
    const type = response.headers.get('content-type') || ''
    const body = type.includes('application/json') ? await response.json() : null
    if (!response.ok) {
      if (response.status === 401) throw { message: 'Session expired. Please log in again.' }
      if (response.status === 403) throw { message: 'Only an authorized admin can manage appointments.' }
      throw body || { message: `Request failed (${response.status}). Check the API URL and authentication.` }
    }
    if (!body) throw { message: 'The API returned HTML instead of JSON. Ensure Accept: application/json is sent.' }
    return body
  }, [])

  const loadReferenceData = useCallback(async () => {
    try {
      const [p, d, dep] = await Promise.all([
        request(`${API}/patients?per_page=100`),
        request(`${API}/doctors?per_page=100`),
        request(`${API}/departments?per_page=100`),
      ])
      setPatients(unwrap(p))
      setDoctors(unwrap(d))
      setDepartments(unwrap(dep))
    } catch (e) {
      setError(messageFrom(e))
    }
  }, [request])

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '5' })
      if (search.trim()) params.set('search', search.trim())
      if (doctorFilter) params.set('doctor_id', doctorFilter)
      if (departmentFilter) params.set('department_id', departmentFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (dateFilter) params.set('date', dateFilter)
      const url = todayOnly
        ? `${API}/appointments/today?page=${page}`
        : `${API}/appointments?${params.toString()}`
      const response = await request(url)
      const data = response?.data
      setAppointments(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
      setPagination({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total ?? 0,
      })
    } catch (e) {
      setAppointments([])
      setError(messageFrom(e))
    } finally {
      setLoading(false)
    }
  }, [request, page, search, doctorFilter, departmentFilter, statusFilter, dateFilter, todayOnly])

  useEffect(() => { loadReferenceData() }, [loadReferenceData])
  useEffect(() => { loadAppointments() }, [loadAppointments])

  function changeFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((old) => {
      const next = { ...old, [name]: value }
      if (name === 'doctor_id') {
        const doctor = doctors.find((item) => String(item.id) === value)
        if (doctor) next.department_id = String(doctor.department_id)
      }
      if (name === 'department_id' && old.doctor_id) {
        const doctor = doctors.find((item) => String(item.id) === old.doctor_id)
        if (doctor && String(doctor.department_id) !== value) next.doctor_id = ''
      }
      return next
    })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
  }

  function createNew() {
    setError('')
    setSuccess('')
    setViewing(null)
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function editAppointment(a) {
    setError('')
    setSuccess('')
    setViewing(null)
    setEditingId(a.id)
    setForm({
      patient_id: String(a.patient_id),
      doctor_id: String(a.doctor_id),
      department_id: String(a.department_id),
      appointment_date: String(a.appointment_date).slice(0, 10),
      appointment_time: String(a.appointment_time).slice(0, 5),
      reason: a.reason || '',
      notes: a.notes || '',
      status: a.status || 'scheduled',
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
      const url = editingId ? `${API}/appointments/${editingId}` : `${API}/appointments`
      const response = await request(url, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setSuccess(response.message || 'Appointment saved successfully.')
      closeForm()
      setPage(1)
      await loadAppointments()
    } catch (e) {
      setError(messageFrom(e))
    } finally {
      setSaving(false)
    }
  }

  async function cancelAppointment(a) {
    if (!window.confirm(`Cancel appointment ${a.appointment_number || `#${a.id}`}? The record will be retained for history.`)) return
    setError('')
    setSuccess('')
    try {
      const response = await request(`${API}/appointments/${a.id}`, { method: 'DELETE' })
      setSuccess(response.message || 'Appointment cancelled.')
      await loadAppointments()
    } catch (e) {
      setError(messageFrom(e))
    }
  }

  async function updateStatus(a, status) {
    setError('')
    setSuccess('')
    try {
      const response = await request(`${API}/appointments/${a.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          patient_id: a.patient_id,
          doctor_id: a.doctor_id,
          department_id: a.department_id,
          appointment_date: String(a.appointment_date).slice(0, 10),
          appointment_time: String(a.appointment_time).slice(0, 5),
          reason: a.reason || '',
          notes: a.notes || '',
          status,
        }),
      })
      setSuccess(response.message || 'Appointment status updated.')
      await loadAppointments()
    } catch (e) {
      setError(messageFrom(e))
    }
  }

  const eligibleDoctors = form.department_id
    ? doctors.filter((d) => String(d.department_id) === String(form.department_id) && d.status !== false && d.status !== 0)
    : doctors.filter((d) => d.status !== false && d.status !== 0)

  function clearFilters() {
    setSearch('')
    setDoctorFilter('')
    setDepartmentFilter('')
    setStatusFilter('')
    setDateFilter('')
    setTodayOnly(false)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Appointment Management</h2>
          <p className="mt-1 text-sm text-gray-500">Book appointments and manage schedules.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setTodayOnly((v) => !v); setPage(1) }} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${todayOnly ? 'border-blue-700 bg-blue-700 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
            {todayOnly ? "Today's appointments ✓" : "Today's appointments"}
          </button>
          <button type="button" onClick={createNew} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">+ Book appointment</button>
        </div>
      </div>

      {error && <div role="alert" className="flex justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setError('')} className="font-bold">×</button></div>}
      {success && <div role="status" className="flex justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><span>{success}</span><button type="button" onClick={() => setSuccess('')} className="font-bold">×</button></div>}

      {showForm && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit appointment' : 'Book a new appointment'}</h3>
            <button type="button" onClick={closeForm} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
          </div>
          <form onSubmit={saveAppointment} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">Patient *
              <select required name="patient_id" value={form.patient_id} onChange={updateForm} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal">
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.patient_id ? `${p.patient_id} — ` : ''}{p.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">Department *
              <select required name="department_id" value={form.department_id} onChange={updateForm} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal">
                <option value="">Select department</option>
                {departments.filter((d) => d.status !== false && d.status !== 0).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">Doctor *
              <select required name="doctor_id" value={form.doctor_id} onChange={updateForm} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal">
                <option value="">Select doctor</option>
                {eligibleDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ''}</option>)}
              </select>
              {form.department_id && eligibleDoctors.length === 0 && <span className="mt-1 block text-xs text-amber-700">No active doctors are assigned to this department.</span>}
            </label>
            <label className="text-sm font-medium text-gray-700">Appointment date *
              <input required type="date" min={new Date().toLocaleDateString('en-CA')} name="appointment_date" value={form.appointment_date} onChange={updateForm} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-medium text-gray-700">Appointment time *
              <input required type="time" name="appointment_time" value={form.appointment_time} onChange={updateForm} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-medium text-gray-700">Status
              <select name="status" value={form.status} onChange={updateForm} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal">
                {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2 xl:col-span-3">Reason for visit
              <input name="reason" maxLength={2000} value={form.reason} onChange={updateForm} placeholder="e.g. General consultation" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2 xl:col-span-3">Notes
              <textarea name="notes" rows={3} maxLength={5000} value={form.notes} onChange={updateForm} placeholder="Optional notes" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal" />
            </label>
            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <button disabled={saving} type="submit" className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create appointment'}</button>
              <button type="button" onClick={closeForm} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <input aria-label="Search appointments" value={search} onChange={(e) => changeFilter(setSearch, e.target.value)} placeholder="Search appointment, patient, doctor…" className="rounded-lg border border-gray-300 px-3 py-2 text-sm xl:col-span-2" />
          <select aria-label="Filter by doctor" value={doctorFilter} onChange={(e) => changeFilter(setDoctorFilter, e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">All doctors</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select aria-label="Filter by department" value={departmentFilter} onChange={(e) => changeFilter(setDepartmentFilter, e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">All departments</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => changeFilter(setStatusFilter, e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">All statuses</option>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <input aria-label="Filter by date" type="date" value={dateFilter} onChange={(e) => changeFilter(setDateFilter, e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-500">{todayOnly ? "Today's appointments" : `${appointments.length} shown · ${pagination.total} total`}</p>
          <button type="button" onClick={clearFilters} className="text-sm font-semibold text-blue-700">Clear filters</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading appointments…</div> : appointments.length === 0 ? (
          <div className="p-10 text-center"><p className="font-semibold text-gray-700">No appointments found</p><p className="mt-1 text-sm text-gray-500">Change your filters or book an appointment.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{['Appointment', 'Patient', 'Doctor / Department', 'Date & time', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4"><p className="font-semibold text-gray-800">{a.appointment_number || `#${a.id}`}</p><p className="mt-1 max-w-40 truncate text-xs text-gray-500">{a.reason || 'No reason'}</p></td>
                    <td className="px-4 py-4"><p className="font-medium text-gray-800">{a.patient?.name || `Patient #${a.patient_id}`}</p><p className="mt-1 text-xs text-gray-500">{a.patient?.patient_id || ''}</p></td>
                    <td className="px-4 py-4"><p className="font-medium text-gray-800">{a.doctor?.name || `Doctor #${a.doctor_id}`}</p><p className="mt-1 text-xs text-gray-500">{a.department?.name || `Department #${a.department_id}`}</p></td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700"><p>{showDate(a.appointment_date)}</p><p className="mt-1 text-xs text-gray-500">{showTime(a.appointment_time)}</p></td>
                    <td className="whitespace-nowrap px-4 py-4"><select aria-label={`Status for ${a.appointment_number}`} value={a.status} onChange={(e) => updateStatus(a, e.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${badgeClass(a.status)}`}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                    <td className="whitespace-nowrap px-4 py-4"><div className="flex flex-wrap gap-2 text-sm"><button type="button" onClick={() => setViewing(a)} className="font-semibold text-blue-700">View</button><button type="button" onClick={() => editAppointment(a)} className="font-semibold text-indigo-700">Edit</button>{a.status !== 'cancelled' && <button type="button" onClick={() => cancelAppointment(a)} className="font-semibold text-red-700">Cancel</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && pagination.last_page > 1 && <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3"><span className="text-sm text-gray-500">Page {pagination.current_page} of {pagination.last_page}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Next</button></div></div>}
      </section>

      {viewing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setViewing(null) }}>
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-start justify-between"><div><h3 className="text-xl font-bold text-gray-800">Appointment details</h3><p className="mt-1 text-sm text-gray-500">{viewing.appointment_number}</p></div><button type="button" onClick={() => setViewing(null)} className="text-xl text-gray-500">×</button></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Patient', viewing.patient?.name || `Patient #${viewing.patient_id}`],
              ['Patient ID', viewing.patient?.patient_id || '—'],
              ['Doctor', viewing.doctor?.name || `Doctor #${viewing.doctor_id}`],
              ['Department', viewing.department?.name || `Department #${viewing.department_id}`],
              ['Date', showDate(viewing.appointment_date)],
              ['Time', showTime(viewing.appointment_time)],
              ['Status', STATUSES.find(([value]) => value === viewing.status)?.[1] || viewing.status],
              ['Reason', viewing.reason || '—'],
            ].map(([label, value]) => <div key={label} className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-gray-800">{value}</p></div>)}
            <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2"><p className="text-xs font-semibold uppercase text-gray-500">Notes</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">{viewing.notes || 'No notes.'}</p></div>
          </div>
          <div className="mt-5 flex justify-end"><button type="button" onClick={() => setViewing(null)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white">Close</button></div>
        </div>
      </div>}
    </div>
  )
}
