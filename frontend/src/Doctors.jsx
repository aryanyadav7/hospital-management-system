
import { useCallback, useEffect, useState } from 'react'
import api from './services/api'

import Button from './components/ui/Button'
import Input from './components/ui/Input'
import Select from './components/ui/Select'
import Card from './components/ui/Card'
import Badge from './components/ui/Badge'

import Table from './components/common/Table'
import Pagination from './components/common/Pagination'
import SearchBar from './components/common/SearchBar'
import Loader from './components/common/Loader'
import Alert from './components/common/Alert'
import Modal from './components/common/Modal'
import ConfirmDialog from './components/common/ConfirmDialog'

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

function getRequestError(error, fallback) {
  return getErrorMessage(error?.data, error?.message || fallback)
}

function getStatus(value) {
  return value === true || value === 1 || value === '1'
}

function getInputValue(value) {
  return typeof value === 'string' ? value : value?.target?.value ?? ''
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
  const [doctorToDelete, setDoctorToDelete] = useState(null)

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

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: String(page),
      })

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (departmentFilter) {
        params.set('department_id', departmentFilter)
      }

      if (statusFilter !== '') {
        params.set('status', statusFilter)
      }

      const response = await api.get(`/doctors?${params.toString()}`)

      if (!response.success) {
        throw new Error(
          getErrorMessage(response, 'Unable to fetch doctors.')
        )
      }

      setDoctors(response.data?.data || [])

      setPagination({
        current_page: response.data?.current_page || 1,
        last_page: response.data?.last_page || 1,
        total: response.data?.total || 0,
      })
    } catch (err) {
      console.error('Fetch doctors error:', err)
      setError(getRequestError(err, 'Unable to fetch doctors.'))
    } finally {
      setLoading(false)
    }
  }, [page, search, departmentFilter, statusFilter])

  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true)

      const response = await api.get('/departments?per_page=100')

      if (!response.success) {
        throw new Error(
          getErrorMessage(response, 'Unable to fetch departments.')
        )
      }

      setDepartments(response.data?.data || [])
    } catch (err) {
      console.error('Fetch departments error:', err)
      setError(getRequestError(err, 'Unable to fetch departments.'))
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
    setForm({ ...emptyForm })
    setEditingDoctorId(null)
    setShowForm(false)
  }

  const openAddForm = () => {
    setError('')
    setSuccess('')
    setViewingDoctor(null)
    setForm({ ...emptyForm })
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
      status: getStatus(doctor.status),
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

      const response = isEditing
        ? await api.put(`/doctors/${editingDoctorId}`, payload)
        : await api.post('/doctors', payload)

      if (!response.success) {
        throw new Error(
          getErrorMessage(
            response,
            isEditing
              ? 'Unable to update doctor.'
              : 'Unable to create doctor.'
          )
        )
      }

      setSuccess(
        isEditing
          ? 'Doctor updated successfully.'
          : 'Doctor created successfully.'
      )

      resetForm()
      await fetchDoctors()
    } catch (err) {
      console.error('Save doctor error:', err)
      setError(
        getRequestError(err, 'Unable to save doctor.')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return

    const doctor = doctorToDelete

    try {
      setDeletingId(doctor.id)
      setError('')
      setSuccess('')

      const response = await api.delete(`/doctors/${doctor.id}`)

      if (!response.success) {
        throw new Error(
          getErrorMessage(response, 'Unable to delete doctor.')
        )
      }

      setSuccess('Doctor deleted successfully.')
      setDoctorToDelete(null)

      if (doctors.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchDoctors()
      }
    } catch (err) {
      console.error('Delete doctor error:', err)
      setError(
        getRequestError(err, 'Unable to delete doctor.')
      )
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

  const departmentOptions = departments.map((department) => ({
    value: String(department.id),
    label: department.name,
  }))

  const departmentFilterOptions = [
    { value: '', label: 'All departments' },
    ...departmentOptions,
  ]

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' },
  ]

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]

  const columns = [
    {
      key: 'doctor',
      label: 'Doctor',
      render: (doctor) => (
        <div>
          <p className="font-medium text-gray-800">{doctor.name}</p>
          <p className="text-sm text-gray-500">{doctor.email}</p>
          <p className="text-sm text-gray-500">{doctor.phone}</p>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (doctor) => doctor.specialization || 'N/A',
    },
    {
      key: 'department',
      label: 'Department',
      render: (doctor) => doctor.department?.name || 'N/A',
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (doctor) => `${doctor.experience ?? 0} years`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (doctor) => (
        <Badge variant={getStatus(doctor.status) ? 'success' : 'danger'}>
          {getStatus(doctor.status) ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (doctor) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setViewingDoctor(doctor)}
          >
            View
          </Button>

          <Button
            variant="success"
            onClick={() => openEditForm(doctor)}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            disabled={deletingId === doctor.id}
            onClick={() => setDoctorToDelete(doctor)}
          >
            {deletingId === doctor.id ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ),
    },
  ]

  const doctorDetails = viewingDoctor
    ? [
        ['Name', viewingDoctor.name],
        ['Email', viewingDoctor.email],
        ['Phone', viewingDoctor.phone],
        ['Department', viewingDoctor.department?.name || 'N/A'],
        ['Specialization', viewingDoctor.specialization],
        ['Experience', `${viewingDoctor.experience ?? 0} years`],
        ['Qualification', viewingDoctor.qualification],
        ['Gender', viewingDoctor.gender],
        [
          'Date of birth',
          viewingDoctor.date_of_birth
            ? String(viewingDoctor.date_of_birth).slice(0, 10)
            : 'Not provided',
        ],
        [
          'Status',
          getStatus(viewingDoctor.status) ? 'Active' : 'Inactive',
        ],
        ['Address', viewingDoctor.address || 'Not provided'],
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            Doctors
          </h3>
          <p className="mt-1 text-gray-500">
            Manage hospital doctors
          </p>
        </div>

        <Button onClick={openAddForm}>
          + Add Doctor
        </Button>
      </div>

      {success && (
        <Alert
          type="success"
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          type="error"
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Card
        title="Search and filters"
        description="Find doctors by name or contact details, department, and status."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search doctors
            </label>

            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(getInputValue(value))
                setPage(1)
              }}
              placeholder="Name, email, phone, specialization..."
            />
          </div>

          <Select
            label="Department"
            name="department_filter"
            value={departmentFilter}
            onChange={(value) => {
              setDepartmentFilter(getInputValue(value))
              setPage(1)
            }}
            options={departmentFilterOptions}
            disabled={departmentsLoading}
          />

          <Select
            label="Status"
            name="status_filter"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(getInputValue(value))
              setPage(1)
            }}
            options={statusOptions}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      <Card title="Doctor directory">
        {loading ? (
          <div className="p-8">
            <Loader message="Loading doctors..." />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={doctors}
              rowKey="id"
              emptyMessage="No doctors found. Try changing your search or filters."
            />

            {pagination.total > 0 && (
              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.last_page}
                  {' · '}
                  {pagination.total} doctor(s)
                </p>

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
        isOpen={showForm}
        onClose={resetForm}
        title={editingDoctorId !== null ? 'Edit Doctor' : 'Add Doctor'}
        size="large"
      >
        <form onSubmit={handleSaveDoctor}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Name *"
              name="name"
              value={form.name}
              onChange={updateField}
              required
              placeholder="Dr. John Doe"
            />

            <Input
              label="Email *"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
              placeholder="doctor@example.com"
            />

            <Input
              label="Phone *"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              required
              placeholder="9876543210"
            />

            <Select
              label="Department *"
              name="department_id"
              value={form.department_id}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  department_id: getInputValue(value),
                }))
              }}
              options={departmentOptions}
              placeholder={
                departmentsLoading
                  ? 'Loading departments...'
                  : 'Select Department'
              }
              required
              disabled={departmentsLoading || departments.length === 0}
            />

            <Input
              label="Specialization *"
              name="specialization"
              value={form.specialization}
              onChange={updateField}
              required
              placeholder="Cardiologist"
            />

            <Input
              label="Experience (years) *"
              name="experience"
              type="number"
              value={form.experience}
              onChange={updateField}
              required
              placeholder="5"
            />

            <Input
              label="Qualification *"
              name="qualification"
              value={form.qualification}
              onChange={updateField}
              required
              placeholder="MBBS, MD"
            />

            <Select
              label="Gender *"
              name="gender"
              value={form.gender}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  gender: getInputValue(value),
                }))
              }}
              options={genderOptions}
              required
            />

            <Input
              label="Date of birth"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={updateField}
            />

            <div className="flex items-center gap-3 pt-6">
              <input
                id="doctor-status"
                name="status"
                type="checkbox"
                checked={form.status}
                onChange={updateField}
                className="h-4 w-4 rounded border-gray-300"
              />

              <label
                htmlFor="doctor-status"
                className="text-sm font-medium text-gray-700"
              >
                Active Doctor
              </label>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="doctor-address"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Address
              </label>

              <textarea
                id="doctor-address"
                name="address"
                value={form.address}
                onChange={updateField}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Doctor's address"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving || departmentsLoading}
            >
              {saving
                ? 'Saving...'
                : editingDoctorId !== null
                  ? 'Update Doctor'
                  : 'Save Doctor'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={viewingDoctor !== null}
        onClose={() => setViewingDoctor(null)}
        title="Doctor Profile"
        size="large"
      >
        <p className="mb-5 text-sm text-gray-500">
          Complete doctor details
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {doctorDetails.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </p>
              <p className="mt-1 break-words text-gray-800">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setViewingDoctor(null)}
          >
            Close
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={doctorToDelete !== null}
        onClose={() => {
          if (deletingId === null) {
            setDoctorToDelete(null)
          }
        }}
        onConfirm={handleDeleteDoctor}
        title="Delete Doctor"
        message={
          doctorToDelete
            ? `Are you sure you want to delete ${doctorToDelete.name}? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Doctor"
        cancelText="Cancel"
        loading={deletingId !== null}
      />
    </div>
  )
}

export default Doctors
