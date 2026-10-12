import { useCallback, useEffect, useState } from 'react'

const API = 'http://127.0.0.1:8000/api/v1'
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const EMPTY_FORM = {
  name: '', email: '', phone: '', date_of_birth: '', gender: 'male',
  blood_group: '', address: '', emergency_contact_name: '',
  emergency_contact_phone: '', status: true,
}

function getMessage(data, fallback) {
  return data?.errors
    ? Object.values(data.errors).flat().join(' ')
    : data?.message || fallback
}

function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  const headers = () => ({
    Accept: 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ page: String(page) })
      if (search.trim()) params.set('search', search.trim())
      if (gender) params.set('gender', gender)
      if (bloodGroup) params.set('blood_group', bloodGroup)
      if (status !== '') params.set('status', status)

      const response = await fetch(`${API}/patients?${params}`, { headers: headers() })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(getMessage(data, 'Unable to fetch patients.'))

      setPatients(data.data.data || [])
      setPagination({
        current_page: data.data.current_page || 1,
        last_page: data.data.last_page || 1,
        total: data.data.total || 0,
      })
    } catch (err) {
      console.error('Fetch patients error:', err)
      setError(err.message || 'Unable to fetch patients.')
    } finally {
      setLoading(false)
    }
  }, [page, search, gender, bloodGroup, status])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const closeForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const openAdd = () => {
    setError('')
    setSuccess('')
    setViewing(null)
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (patient) => {
    setError('')
    setSuccess('')
    setViewing(null)
    setEditingId(patient.id)
    setForm({
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth ? String(patient.date_of_birth).slice(0, 10) : '',
      gender: patient.gender || 'male',
      blood_group: patient.blood_group || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      status: Boolean(patient.status),
    })
    setShowForm(true)
  }

  const changeField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((old) => ({ ...old, [name]: type === 'checkbox' ? checked : value }))
  }

  const savePatient = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const editing = editingId !== null
      const payload = {
        ...form,
        email: form.email.trim() || null,
        date_of_birth: form.date_of_birth || null,
        blood_group: form.blood_group || null,
        address: form.address.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      }

      const response = await fetch(editing ? `${API}/patients/${editingId}` : `${API}/patients`, {
        method: editing ? 'PUT' : 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(getMessage(data, editing ? 'Unable to update patient.' : 'Unable to register patient.'))
      }

      setSuccess(editing ? 'Patient updated successfully.' : 'Patient registered successfully.')
      closeForm()
      setPage(1)
      if (page === 1) await fetchPatients()
    } catch (err) {
      console.error('Save patient error:', err)
      setError(err.message || 'Unable to save patient.')
    } finally {
      setSaving(false)
    }
  }

  const deletePatient = async (patient) => {
    if (!window.confirm(`Are you sure you want to delete ${patient.name}? This action cannot be undone.`)) return
    try {
      setDeletingId(patient.id)
      setError('')
      setSuccess('')
      const response = await fetch(`${API}/patients/${patient.id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(getMessage(data, 'Unable to delete patient.'))

      setSuccess('Patient deleted successfully.')
      if (patients.length === 1 && page > 1) setPage((current) => current - 1)
      else await fetchPatients()
    } catch (err) {
      console.error('Delete patient error:', err)
      setError(err.message || 'Unable to delete patient.')
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setGender('')
    setBloodGroup('')
    setStatus('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Patients</h3>
          <p className="mt-1 text-gray-500">Register and manage hospital patients</p>
        </div>
        <button type="button" onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + Register Patient
        </button>
      </div>

      {success && <div role="status" className="rounded-lg bg-green-100 px-4 py-3 text-green-700">{success}</div>}
      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg bg-red-100 px-4 py-3 text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {showForm && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Patient' : 'Register Patient'}</h4>
              <p className="mt-1 text-sm text-gray-500">Patient ID is generated automatically after registration.</p>
            </div>
            <button type="button" onClick={closeForm} className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label="Close form">✕</button>
          </div>

          <form onSubmit={savePatient}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-gray-700">Full name *</label>
                <input id="patient-name" name="name" value={form.name} onChange={changeField} required maxLength={255} className="w-full rounded-lg border px-3 py-2" placeholder="Patient full name" />
              </div>
              <div>
                <label htmlFor="patient-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input id="patient-email" name="email" type="email" value={form.email} onChange={changeField} maxLength={255} className="w-full rounded-lg border px-3 py-2" placeholder="patient@example.com" />
              </div>
              <div>
                <label htmlFor="patient-phone" className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
                <input id="patient-phone" name="phone" type="tel" value={form.phone} onChange={changeField} required maxLength={20} className="w-full rounded-lg border px-3 py-2" placeholder="9876543210" />
              </div>
              <div>
                <label htmlFor="patient-dob" className="mb-1 block text-sm font-medium text-gray-700">Date of birth</label>
                <input id="patient-dob" name="date_of_birth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={changeField} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label htmlFor="patient-gender" className="mb-1 block text-sm font-medium text-gray-700">Gender *</label>
                <select id="patient-gender" name="gender" value={form.gender} onChange={changeField} required className="w-full rounded-lg border bg-white px-3 py-2">
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="patient-blood" className="mb-1 block text-sm font-medium text-gray-700">Blood group</label>
                <select id="patient-blood" name="blood_group" value={form.blood_group} onChange={changeField} className="w-full rounded-lg border bg-white px-3 py-2">
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="patient-emergency-name" className="mb-1 block text-sm font-medium text-gray-700">Emergency contact name</label>
                <input id="patient-emergency-name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={changeField} maxLength={255} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label htmlFor="patient-emergency-phone" className="mb-1 block text-sm font-medium text-gray-700">Emergency contact phone</label>
                <input id="patient-emergency-phone" name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={changeField} maxLength={20} className="w-full rounded-lg border px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="patient-address" className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <textarea id="patient-address" name="address" value={form.address} onChange={changeField} rows={3} className="w-full rounded-lg border px-3 py-2" placeholder="Patient's full address" />
              </div>
              <div className="flex items-center gap-3">
                <input id="patient-status" name="status" type="checkbox" checked={form.status} onChange={changeField} className="h-4 w-4" />
                <label htmlFor="patient-status" className="text-sm font-medium text-gray-700">Active patient</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update Patient' : 'Register Patient'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="patient-search" className="mb-1 block text-sm font-medium text-gray-700">Search patients</label>
            <input id="patient-search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Patient ID, name, email, phone..." className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="filter-gender" className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
            <select id="filter-gender" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1) }} className="w-full rounded-lg border bg-white px-3 py-2">
              <option value="">All genders</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-blood" className="mb-1 block text-sm font-medium text-gray-700">Blood group</label>
            <select id="filter-blood" value={bloodGroup} onChange={(e) => { setBloodGroup(e.target.value); setPage(1) }} className="w-full rounded-lg border bg-white px-3 py-2">
              <option value="">All blood groups</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select id="filter-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="w-full rounded-lg border bg-white px-3 py-2">
              <option value="">All statuses</option><option value="1">Active</option><option value="0">Inactive</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end"><button type="button" onClick={clearFilters} className="text-sm font-medium text-blue-600 hover:underline">Clear filters</button></div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? <div className="p-8 text-center text-gray-500">Loading patients...</div> :
          patients.length === 0 ? <div className="p-8 text-center text-gray-500">No patients found. Try changing your search or filters.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50"><tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Gender / DOB</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Blood group</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr></thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="border-b last:border-b-0">
                      <td className="px-6 py-4"><p className="font-medium text-gray-800">{patient.name}</p><p className="text-sm text-gray-500">{patient.patient_id}</p></td>
                      <td className="px-6 py-4"><p className="text-gray-700">{patient.phone}</p><p className="text-sm text-gray-500">{patient.email || 'No email'}</p></td>
                      <td className="px-6 py-4 text-gray-700"><p className="capitalize">{patient.gender}</p><p className="text-sm text-gray-500">{patient.date_of_birth ? String(patient.date_of_birth).slice(0, 10) : 'DOB not provided'}</p></td>
                      <td className="px-6 py-4 text-gray-700">{patient.blood_group || '—'}</td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${patient.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{patient.status ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-6 py-4"><div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => setViewing(patient)} className="text-blue-600 hover:underline">View</button>
                        <button type="button" onClick={() => openEdit(patient)} className="text-green-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => deletePatient(patient)} disabled={deletingId === patient.id} className="text-red-600 hover:underline disabled:opacity-50">{deletingId === patient.id ? 'Deleting...' : 'Delete'}</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {!loading && pagination.total > 0 && <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">Page {pagination.current_page} of {pagination.last_page} · {pagination.total} patient(s)</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.current_page <= 1} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
            <button type="button" onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page >= pagination.last_page} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>}
      </section>

      {viewing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => setViewing(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="patient-profile-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-5 flex items-center justify-between"><div><h4 id="patient-profile-title" className="text-xl font-bold text-gray-800">Patient Profile</h4><p className="text-sm text-gray-500">{viewing.patient_id}</p></div><button type="button" onClick={() => setViewing(null)} className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label="Close profile">✕</button></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ['Full name', viewing.name], ['Patient ID', viewing.patient_id],
              ['Email', viewing.email || 'Not provided'], ['Phone', viewing.phone],
              ['Date of birth', viewing.date_of_birth ? String(viewing.date_of_birth).slice(0, 10) : 'Not provided'],
              ['Gender', viewing.gender], ['Blood group', viewing.blood_group || 'Not provided'],
              ['Status', viewing.status ? 'Active' : 'Inactive'],
              ['Emergency contact', viewing.emergency_contact_name || 'Not provided'],
              ['Emergency phone', viewing.emergency_contact_phone || 'Not provided'],
              ['Address', viewing.address || 'Not provided'],
            ].map(([label, value]) => <div key={label} className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 break-words text-gray-800">{value}</p></div>)}
          </div>
          <div className="mt-6 rounded-lg border p-4"><h5 className="font-semibold text-gray-800">Appointment history</h5><p className="mt-1 text-sm text-gray-500">Appointment history will appear here after the Appointment Management module and patient relationship are implemented.</p></div>
          <div className="mt-6 flex justify-end"><button type="button" onClick={() => setViewing(null)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Close</button></div>
        </section>
      </div>}
    </div>
  )
}

export default Patients
