import { useCallback, useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api/v1'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  department_id: '',
  specialization: '',
  experience: '',
  qualification: '',
  gender: 'male',
  date_of_birth: '',
  address: '',
  status: true,
}

function getErrorMessage(data, fallback) {
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.message || fallback
}

function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingDoctorId, setEditingDoctorId] = useState(null)
  const [viewingDoctor, setViewingDoctor] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

  const token = () => localStorage.getItem('token')

  const authHeaders = () => ({
    Accept: 'application/json',
    Authorization: `Bearer ${token()}`,
  })

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({ page: String(page) })
      if (search.trim()) params.set('search', search.trim())
      if (departmentFilter) params.set('department_id', departmentFilter)
      if (statusFilter !== '') params.set('status', statusFilter)

      const response = await fetch(`${API_BASE}/doctors?${params.toString()}`, {
        headers: authHeaders(),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(getErrorMessage(data, 'Unable to fetch doctors.'))
      }

      setDoctors(data.data.data || [])
      setPagination({
        current_page: data.data.current_page || 1,
        last_page: data.data.last_page || 1,
        total: data.data.total || 0,
      })
    } catch (err) {
      console.error('Fetch doctors error:', err)
      setError(err.message || 'Unable to fetch doctors.')
    } finally {
      setLoading(false)
    }
  }, [page, search, departmentFilter, statusFilter])

  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true)
      const response = await fetch(`${API_BASE}/departments?per_page=100`, {
        headers: authHeaders(),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(getErrorMessage(data, 'Unable to fetch departments.'))
      }

      setDepartments(data.data.data || [])
    } catch (err) {
      console.error('Fetch departments error:', err)
      setError(err.message || 'Unable to fetch departments.')
    } finally {
      setDepartmentsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingDoctorId(null)
    setShowForm(false)
  }

  const openAddForm = () => {
    setError('')
    setSuccess('')
    setViewingDoctor(null)
    setForm(emptyForm)
    setEditingDoctorId(null)
    setShowForm(true)
  }

  const openEditForm = (doctor) => {
    setError('')
    setSuccess('')
    setViewingDoctor(null)
    setEditingDoctorId(doctor.id)
    setForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      department_id: String(doctor.department_id || ''),
      specialization: doctor.specialization || '',
      experience: String(doctor.experience ?? ''),
      qualification: doctor.qualification || '',
      gender: doctor.gender || 'male',
      date_of_birth: doctor.date_of_birth
        ? String(doctor.date_of_birth).slice(0, 10)
        : '',
      address: doctor.address || '',
      status: Boolean(doctor.status),
    })
    setShowForm(true)
  }

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSaveDoctor = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const isEditing = editingDoctorId !== null
      const payload = {
        ...form,
        department_id: Number(form.department_id),
        experience: Number(form.experience),
        date_of_birth: form.date_of_birth || null,
        address: form.address.trim() || null,
      }

      const response = await fetch(
        isEditing
          ? `${API_BASE}/doctors/${editingDoctorId}`
          : `${API_BASE}/doctors`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          getErrorMessage(data, isEditing ? 'Unable to update doctor.' : 'Unable to create doctor.'),
        )
      }

      setSuccess(isEditing ? 'Doctor updated successfully.' : 'Doctor created successfully.')
      resetForm()
      await fetchDoctors()
    } catch (err) {
      console.error('Save doctor error:', err)
      setError(err.message || 'Unable to save doctor.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDoctor = async (doctor) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${doctor.name}? This action cannot be undone.`,
    )
    if (!confirmed) return

    try {
      setDeletingId(doctor.id)
      setError('')
      setSuccess('')

      const response = await fetch(`${API_BASE}/doctors/${doctor.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(getErrorMessage(data, 'Unable to delete doctor.'))
      }

      setSuccess('Doctor deleted successfully.')
      if (doctors.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchDoctors()
      }
    } catch (err) {
      console.error('Delete doctor error:', err)
      setError(err.message || 'Unable to delete doctor.')
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDepartmentFilter('')
    setStatusFilter('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Doctors</h3>
          <p className="mt-1 text-gray-500">Manage hospital doctors</p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Doctor
        </button>
      </div>

      {success && (
        <div role="status" className="rounded-lg bg-green-100 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg bg-red-100 px-4 py-3 text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            ✕
          </button>
        </div>
      )}

      {showForm && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-bold text-gray-800">
                {editingDoctorId ? 'Edit Doctor' : 'Add Doctor'}
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {editingDoctorId ? 'Update the doctor details below.' : 'Enter the new doctor details below.'}
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveDoctor}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="doctor-name" className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                <input id="doctor-name" name="name" value={form.name} onChange={updateField} required maxLength={255} className="w-full rounded-lg border px-3 py-2" placeholder="Dr. John Doe" />
              </div>

              <div>
                <label htmlFor="doctor-email" className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                <input id="doctor-email" name="email" type="email" value={form.email} onChange={updateField} required maxLength={255} className="w-full rounded-lg border px-3 py-2" placeholder="doctor@example.com" />
              </div>

              <div>
                <label htmlFor="doctor-phone" className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
                <input id="doctor-phone" name="phone" type="tel" value={form.phone} onChange={updateField} required maxLength={20} className="w-full rounded-lg border px-3 py-2" placeholder="9876543210" />
              </div>

              <div>
                <label htmlFor="doctor-department" className="mb-1 block text-sm font-medium text-gray-700">Department *</label>
                <select id="doctor-department" name="department_id" value={form.department_id} onChange={updateField} required disabled={departmentsLoading} className="w-full rounded-lg border bg-white px-3 py-2">
                  <option value="">{departmentsLoading ? 'Loading departments...' : 'Select Department'}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="doctor-specialization" className="mb-1 block text-sm font-medium text-gray-700">Specialization *</label>
                <input id="doctor-specialization" name="specialization" value={form.specialization} onChange={updateField} required maxLength={255} className="w-full rounded-lg border px-3 py-2" placeholder="Cardiologist" />
              </div>

              <div>
                <label htmlFor="doctor-experience" className="mb-1 block text-sm font-medium text-gray-700">Experience (years) *</label>
                <input id="doctor-experience" name="experience" type="number" min="0" step="1" value={form.experience} onChange={updateField} required className="w-full rounded-lg border px-3 py-2" placeholder="5" />
              </div>

              <div>
                <label htmlFor="doctor-qualification" className="mb-1 block text-sm font-medium text-gray-700">Qualification *</label>
                <input id="doctor-qualification" name="qualification" value={form.qualification} onChange={updateField} required maxLength={255} className="w-full rounded-lg border px-3 py-2" placeholder="MBBS, MD" />
              </div>

              <div>
                <label htmlFor="doctor-gender" className="mb-1 block text-sm font-medium text-gray-700">Gender *</label>
                <select id="doctor-gender" name="gender" value={form.gender} onChange={updateField} required className="w-full rounded-lg border bg-white px-3 py-2">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="doctor-dob" className="mb-1 block text-sm font-medium text-gray-700">Date of Birth</label>
                <input id="doctor-dob" name="date_of_birth" type="date" value={form.date_of_birth} onChange={updateField} className="w-full rounded-lg border px-3 py-2" />
              </div>

              <div className="flex items-center gap-3 pt-2 md:pt-7">
                <input id="doctor-status" name="status" type="checkbox" checked={form.status} onChange={updateField} className="h-4 w-4" />
                <label htmlFor="doctor-status" className="text-sm font-medium text-gray-700">Active Doctor</label>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="doctor-address" className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <textarea id="doctor-address" name="address" value={form.address} onChange={updateField} rows={3} className="w-full rounded-lg border px-3 py-2" placeholder="Doctor's address" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={resetForm} disabled={saving} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving || departmentsLoading} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Saving...' : editingDoctorId ? 'Update Doctor' : 'Save Doctor'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label htmlFor="doctor-search" className="mb-1 block text-sm font-medium text-gray-700">Search doctors</label>
            <input id="doctor-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Name, email, phone, specialization..." className="w-full rounded-lg border px-3 py-2" />
          </div>

          <div>
            <label htmlFor="filter-department" className="mb-1 block text-sm font-medium text-gray-700">Department</label>
            <select id="filter-department" value={departmentFilter} onChange={(event) => { setDepartmentFilter(event.target.value); setPage(1) }} className="w-full rounded-lg border bg-white px-3 py-2">
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select id="filter-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} className="w-full rounded-lg border bg-white px-3 py-2">
              <option value="">All statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button type="button" onClick={clearFilters} className="text-sm font-medium text-blue-600 hover:underline">
            Clear filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No doctors found. Try changing your search or filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Specialization</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="border-b last:border-b-0">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{doctor.name}</p>
                      <p className="text-sm text-gray-500">{doctor.email}</p>
                      <p className="text-sm text-gray-500">{doctor.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{doctor.specialization}</td>
                    <td className="px-6 py-4 text-gray-700">{doctor.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-700">{doctor.experience} years</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${doctor.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {doctor.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => setViewingDoctor(doctor)} className="text-blue-600 hover:underline">View</button>
                        <button type="button" onClick={() => openEditForm(doctor)} className="text-green-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => handleDeleteDoctor(doctor)} disabled={deletingId === doctor.id} className="text-red-600 hover:underline disabled:opacity-50">
                          {deletingId === doctor.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page {pagination.current_page} of {pagination.last_page} · {pagination.total} doctor(s)
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={pagination.current_page <= 1} className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                Previous
              </button>
              <button type="button" onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))} disabled={pagination.current_page >= pagination.last_page} className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {viewingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => setViewingDoctor(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="doctor-view-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 id="doctor-view-title" className="text-xl font-bold text-gray-800">Doctor Profile</h4>
                <p className="text-sm text-gray-500">Complete doctor details</p>
              </div>
              <button type="button" onClick={() => setViewingDoctor(null)} className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label="Close doctor profile">✕</button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['Name', viewingDoctor.name],
                ['Email', viewingDoctor.email],
                ['Phone', viewingDoctor.phone],
                ['Department', viewingDoctor.department?.name || 'N/A'],
                ['Specialization', viewingDoctor.specialization],
                ['Experience', `${viewingDoctor.experience} years`],
                ['Qualification', viewingDoctor.qualification],
                ['Gender', viewingDoctor.gender],
                ['Date of birth', viewingDoctor.date_of_birth ? String(viewingDoctor.date_of_birth).slice(0, 10) : 'Not provided'],
                ['Status', viewingDoctor.status ? 'Active' : 'Inactive'],
                ['Address', viewingDoctor.address || 'Not provided'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="mt-1 break-words text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setViewingDoctor(null)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Doctors
