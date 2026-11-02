
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: 'male',
  blood_group: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  status: true,
}

function getMessage(data, fallback) {
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.message || fallback
}

function getRequestError(error, fallback) {
  return getMessage(
    error?.data || { message: error?.message },
    fallback
  )
}

function getInputValue(value) {
  return typeof value === 'string'
    ? value
    : value?.target?.value ?? ''
}

function getStatus(value) {
  return value === true || value === 1 || value === '1'
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
  const [patientToDelete, setPatientToDelete] = useState(null)

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [fieldErrors, setFieldErrors] = useState({})

  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [status, setStatus] = useState('')

  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: String(page),
      })

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (gender) {
        params.set('gender', gender)
      }

      if (bloodGroup) {
        params.set('blood_group', bloodGroup)
      }

      if (status !== '') {
        params.set('status', status)
      }

      const response = await api.get(`/patients?${params.toString()}`)

      if (!response.success) {
        throw new Error(
          getMessage(response, 'Unable to fetch patients.')
        )
      }

      setPatients(response.data?.data || [])

      setPagination({
        current_page: response.data?.current_page || 1,
        last_page: response.data?.last_page || 1,
        total: response.data?.total || 0,
      })
    } catch (err) {
      console.error('Fetch patients error:', err)
      setError(getRequestError(err, 'Unable to fetch patients.'))
    } finally {
      setLoading(false)
    }
  }, [page, search, gender, bloodGroup, status])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const clearFieldError = (name) => {
    setFieldErrors((current) => {
      if (!current[name]) return current

      const updated = { ...current }
      delete updated[name]

      return updated
    })
  }

  const renderFieldError = (name) => {
    if (!fieldErrors[name]) return null

    return (
      <p className="mt-1 text-sm text-red-600">
        {Array.isArray(fieldErrors[name])
          ? fieldErrors[name].join(' ')
          : fieldErrors[name]}
      </p>
    )
  }

  const closeForm = () => {
    setForm({ ...EMPTY_FORM })
    setFieldErrors({})
    setEditingId(null)
    setShowForm(false)
  }

  const openAdd = () => {
    setError('')
    setSuccess('')
    setFieldErrors({})
    setViewing(null)
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (patient) => {
    setError('')
    setSuccess('')
    setFieldErrors({})
    setViewing(null)

    setEditingId(patient.id)

    setForm({
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth
        ? String(patient.date_of_birth).slice(0, 10)
        : '',
      gender: patient.gender || 'male',
      blood_group: patient.blood_group || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      status: getStatus(patient.status),
    })

    setShowForm(true)
  }

  const changeField = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    clearFieldError(name)
    setError('')
  }

  const updateSelectField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: getInputValue(value),
    }))

    clearFieldError(name)
    setError('')
  }

  const savePatient = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      setFieldErrors({})

      const editing = editingId !== null

      const payload = {
        ...form,
        email: form.email.trim() || null,
        date_of_birth: form.date_of_birth || null,
        blood_group: form.blood_group || null,
        address: form.address.trim() || null,
        emergency_contact_name:
          form.emergency_contact_name.trim() || null,
        emergency_contact_phone:
          form.emergency_contact_phone.trim() || null,
      }

      const response = editing
        ? await api.put(`/patients/${editingId}`, payload)
        : await api.post('/patients', payload)

      if (!response.success) {
        throw new Error(
          getMessage(
            response,
            editing
              ? 'Unable to update patient.'
              : 'Unable to register patient.'
          )
        )
      }

      setSuccess(
        editing
          ? 'Patient updated successfully.'
          : 'Patient registered successfully.'
      )

      closeForm()

      if (page !== 1) {
        setPage(1)
      } else {
        await fetchPatients()
      }
    } catch (err) {
      console.error('Save patient error:', err)

      const errors = err?.errors || err?.data?.errors || {}

      if (
        err?.isValidationError ||
        err?.status === 422 ||
        Object.keys(errors).length > 0
      ) {
        setFieldErrors(errors)
        setError('Please correct the highlighted fields.')
      } else {
        setError(getRequestError(err, 'Unable to save patient.'))
      }
    } finally {
      setSaving(false)
    }
  }

  const deletePatient = async () => {
    if (!patientToDelete) return

    const patient = patientToDelete

    try {
      setDeletingId(patient.id)
      setError('')
      setSuccess('')

      const response = await api.delete(`/patients/${patient.id}`)

      if (!response.success) {
        throw new Error(
          getMessage(response, 'Unable to delete patient.')
        )
      }

      setSuccess('Patient deleted successfully.')
      setPatientToDelete(null)

      if (patients.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchPatients()
      }
    } catch (err) {
      console.error('Delete patient error:', err)
      setError(getRequestError(err, 'Unable to delete patient.'))
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

  const genderOptions = [
    { value: '', label: 'All genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]

  const bloodGroupOptions = [
    { value: '', label: 'All blood groups' },
    ...BLOOD_GROUPS.map((group) => ({
      value: group,
      label: group,
    })),
  ]

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' },
  ]

  const formGenderOptions = genderOptions.filter(
    (option) => option.value !== ''
  )

  const formBloodGroupOptions = [
    { value: '', label: 'Select blood group' },
    ...BLOOD_GROUPS.map((group) => ({
      value: group,
      label: group,
    })),
  ]

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (patient) => (
        <div>
          <p className="font-medium text-gray-800">
            {patient.name}
          </p>
          <p className="text-sm text-gray-500">
            {patient.patient_id}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (patient) => (
        <div>
          <p className="text-gray-700">{patient.phone}</p>
          <p className="text-sm text-gray-500">
            {patient.email || 'No email'}
          </p>
        </div>
      ),
    },
    {
      key: 'gender_dob',
      label: 'Gender / DOB',
      render: (patient) => (
        <div>
          <p className="capitalize text-gray-700">
            {patient.gender}
          </p>
          <p className="text-sm text-gray-500">
            {patient.date_of_birth
              ? String(patient.date_of_birth).slice(0, 10)
              : 'DOB not provided'}
          </p>
        </div>
      ),
    },
    {
      key: 'blood_group',
      label: 'Blood group',
      render: (patient) => patient.blood_group || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (patient) => (
        <Badge
          variant={getStatus(patient.status) ? 'success' : 'danger'}
        >
          {getStatus(patient.status) ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (patient) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setViewing(patient)}
          >
            View
          </Button>

          <Button
            variant="success"
            onClick={() => openEdit(patient)}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            disabled={deletingId === patient.id}
            onClick={() => setPatientToDelete(patient)}
          >
            {deletingId === patient.id ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ),
    },
  ]

  const patientDetails = viewing
    ? [
        ['Full name', viewing.name],
        ['Patient ID', viewing.patient_id],
        ['Email', viewing.email || 'Not provided'],
        ['Phone', viewing.phone],
        [
          'Date of birth',
          viewing.date_of_birth
            ? String(viewing.date_of_birth).slice(0, 10)
            : 'Not provided',
        ],
        ['Gender', viewing.gender],
        ['Blood group', viewing.blood_group || 'Not provided'],
        [
          'Status',
          getStatus(viewing.status) ? 'Active' : 'Inactive',
        ],
        [
          'Emergency contact',
          viewing.emergency_contact_name || 'Not provided',
        ],
        [
          'Emergency phone',
          viewing.emergency_contact_phone || 'Not provided',
        ],
        ['Address', viewing.address || 'Not provided'],
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            Patients
          </h3>
          <p className="mt-1 text-gray-500">
            Register and manage hospital patients
          </p>
        </div>

        <Button onClick={openAdd}>
          + Register Patient
        </Button>
      </div>

      {/* Success and error messages */}
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

      {/* Patient registration and editing form */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          if (!saving) closeForm()
        }}
        title={editingId !== null ? 'Edit Patient' : 'Register Patient'}
        size="large"
      >
        <p className="mb-5 text-sm text-gray-500">
          Patient ID is generated automatically after registration.
        </p>

        <form onSubmit={savePatient}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Input
                label="Full name *"
                name="name"
                value={form.name}
                onChange={changeField}
                required
                placeholder="Patient full name"
              />
              {renderFieldError('name')}
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={changeField}
                placeholder="patient@example.com"
              />
              {renderFieldError('email')}
            </div>

            <div>
              <Input
                label="Phone *"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={changeField}
                required
                placeholder="9876543210"
              />
              {renderFieldError('phone')}
            </div>

            <div>
              <Input
                label="Date of birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={changeField}
              />
              {renderFieldError('date_of_birth')}
            </div>

            <div>
              <Select
                label="Gender *"
                name="gender"
                value={form.gender}
                onChange={(value) => updateSelectField('gender', value)}
                options={formGenderOptions}
                required
              />
              {renderFieldError('gender')}
            </div>

            <div>
              <Select
                label="Blood group"
                name="blood_group"
                value={form.blood_group}
                onChange={(value) => updateSelectField('blood_group', value)}
                options={formBloodGroupOptions}
              />
              {renderFieldError('blood_group')}
            </div>

            <div>
              <Input
                label="Emergency contact name"
                name="emergency_contact_name"
                value={form.emergency_contact_name}
                onChange={changeField}
                placeholder="Contact person's name"
              />
              {renderFieldError('emergency_contact_name')}
            </div>

            <div>
              <Input
                label="Emergency contact phone"
                name="emergency_contact_phone"
                type="tel"
                value={form.emergency_contact_phone}
                onChange={changeField}
                placeholder="Emergency phone number"
              />
              {renderFieldError('emergency_contact_phone')}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="patient-address"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Address
              </label>

              <textarea
                id="patient-address"
                name="address"
                value={form.address}
                onChange={changeField}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Patient's full address"
              />
              {renderFieldError('address')}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <input
                  id="patient-status"
                  name="status"
                  type="checkbox"
                  checked={form.status}
                  onChange={changeField}
                  className="h-4 w-4 rounded border-gray-300"
                />

                <label
                  htmlFor="patient-status"
                  className="text-sm font-medium text-gray-700"
                >
                  Active patient
                </label>
              </div>
              {renderFieldError('status')}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId !== null
                  ? 'Update Patient'
                  : 'Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Search and filters */}
      <Card
        title="Search and filters"
        description="Find patients using their details, gender, blood group, or status."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search patients
            </label>

            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(getInputValue(value))
                setPage(1)
              }}
              placeholder="Patient ID, name, email, phone..."
            />
          </div>

          <Select
            label="Gender"
            name="filter_gender"
            value={gender}
            onChange={(value) => {
              setGender(getInputValue(value))
              setPage(1)
            }}
            options={genderOptions}
          />

          <Select
            label="Blood group"
            name="filter_blood_group"
            value={bloodGroup}
            onChange={(value) => {
              setBloodGroup(getInputValue(value))
              setPage(1)
            }}
            options={bloodGroupOptions}
          />

          <Select
            label="Status"
            name="filter_status"
            value={status}
            onChange={(value) => {
              setStatus(getInputValue(value))
              setPage(1)
            }}
            options={statusOptions}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      </Card>

      {/* Patient table and pagination */}
      <Card title="Patient directory">
        {loading ? (
          <div className="p-8">
            <Loader message="Loading patients..." />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={patients}
              rowKey="id"
              emptyMessage="No patients found. Try changing your search or filters."
            />

            {pagination.total > 0 && (
              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.last_page}
                  {' · '}
                  {pagination.total} patient(s)
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

      {/* Patient profile */}
      <Modal
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        title="Patient Profile"
        size="large"
      >
        <p className="mb-5 text-sm text-gray-500">
          {viewing?.patient_id || 'Complete patient details'}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {patientDetails.map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg bg-gray-50 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </p>

              <p className="mt-1 break-words text-gray-800">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border p-4">
          <h5 className="font-semibold text-gray-800">
            Appointment history
          </h5>

          <p className="mt-1 text-sm text-gray-500">
            Appointment history will appear here after the Appointment
            Management module and patient relationship are implemented.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setViewing(null)}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={patientToDelete !== null}
        onClose={() => {
          if (deletingId === null) {
            setPatientToDelete(null)
          }
        }}
        onConfirm={deletePatient}
        title="Delete Patient"
        message={
          patientToDelete
            ? `Are you sure you want to delete ${patientToDelete.name}? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Patient"
        cancelText="Cancel"
        loading={deletingId !== null}
      />
    </div>
  )
}

export default Patients
