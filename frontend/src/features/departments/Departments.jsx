
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

const EMPTY_FORM = {
  name: '',
  description: '',
  status: true,
}

function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingDepartment, setEditingDepartment] = useState(null)

  const [departmentToDelete, setDepartmentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch departments from Laravel API.
  const fetchDepartments = useCallback(
    async (page = 1, searchTerm = search) => {
      try {
        setLoading(true)
        setError('')

        const data = await api.get(
          `/departments?page=${page}&search=${encodeURIComponent(searchTerm)}`
        )

        if (!data.success) {
          throw new Error(data.message || 'Unable to load departments.')
        }

        setDepartments(data.data.data || [])
        setCurrentPage(data.data.current_page || 1)
        setLastPage(data.data.last_page || 1)
      } catch (err) {
        console.error('Departments error:', err)
        setError(err.message || 'Unable to load departments.')
      } finally {
        setLoading(false)
      }
    },
    [search]
  )

  useEffect(() => {
    fetchDepartments(1, '')
  }, []) // Initial load only.

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingDepartment(null)
  }

  const openCreateForm = () => {
    resetForm()
    setError('')
    setShowForm(true)
  }

  const openEditForm = (department) => {
    setEditingDepartment(department)
    setForm({
      name: department.name || '',
      description: department.description || '',
      status:
        department.status === true ||
        department.status === 1 ||
        department.status === '1',
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  // Create or update a department.
  const handleSaveDepartment = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const isEditing = editingDepartment !== null

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      }

      const data = isEditing
        ? await api.put(
            `/departments/${editingDepartment.id}`,
            payload
          )
        : await api.post('/departments', payload)

      if (!data.success) {
        throw new Error(data.message || 'Unable to save department.')
      }

      setSuccess(
        isEditing
          ? 'Department updated successfully.'
          : 'Department created successfully.'
      )

      closeForm()

      await fetchDepartments(
        isEditing ? currentPage : 1,
        search
      )
    } catch (err) {
      console.error('Save department error:', err)

      const validationMessage = err.data?.errors
        ? Object.values(err.data.errors).flat().join(' ')
        : ''

      setError(
        validationMessage ||
          err.message ||
          'Unable to save department.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Delete a department after confirmation.
  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return

    setError('')
    setSuccess('')
    setDeleting(true)

    try {
      const data = await api.delete(
        `/departments/${departmentToDelete.id}`
      )

      if (!data.success) {
        throw new Error(data.message || 'Unable to delete department.')
      }

      setSuccess('Department deleted successfully.')
      setDepartmentToDelete(null)

      const nextPage =
        departments.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage

      await fetchDepartments(nextPage, search)
    } catch (err) {
      console.error('Delete department error:', err)
      setError(err.message || 'Unable to delete department.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = () => {
    fetchDepartments(1, search)
  }

  const handleClearSearch = () => {
    setSearch('')
    fetchDepartments(1, '')
  }

  const columns = [
    {
      key: 'name',
      label: 'Department',
      render: (department) => (
        <div>
          <p className="font-semibold text-gray-800">
            {department.name}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {department.description || 'No description available.'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (department) => {
        const isActive =
          department.status === true ||
          department.status === 1 ||
          department.status === '1'

        return (
          <Badge variant={isActive ? 'success' : 'danger'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (department) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => openEditForm(department)}
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => setDepartmentToDelete(department)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading && departments.length === 0) {
    return (
      <Card title="Departments">
        <Loader message="Loading departments..." />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <Alert
          type="error"
          title="Something went wrong"
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          type="success"
          title="Success"
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Departments
          </h1>
          <p className="mt-2 text-gray-600">
            Manage hospital departments.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={showForm ? closeForm : openCreateForm}
        >
          {showForm ? 'Close Form' : 'Add Department'}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={(value) =>
                setSearch(
                  typeof value === 'string'
                    ? value
                    : value.target.value
                )
              }
              placeholder="Search departments..."
            />
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </Button>

          {search && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearSearch}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Department form modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={
          editingDepartment ? 'Edit Department' : 'Add Department'
        }
        size="medium"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-5">
          <Input
            label="Department Name"
            name="name"
            value={form.name}
            onChange={(event) =>
              handleFormChange('name', event.target.value)
            }
            placeholder="Enter department name"
            required
            disabled={saving}
          />

          <div>
            <label
              htmlFor="department-description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="department-description"
              name="description"
              value={form.description}
              onChange={(event) =>
                handleFormChange('description', event.target.value)
              }
              placeholder="Enter department description"
              rows={4}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <Select
            label="Status"
            name="status"
            value={form.status ? 'active' : 'inactive'}
            onChange={(event) =>
              handleFormChange(
                'status',
                event.target.value === 'active'
              )
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            required
            disabled={saving}
          />

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="success"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingDepartment
                  ? 'Update Department'
                  : 'Save Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Departments table */}
      <Card
        title="Department List"
        description="View, search, edit, and delete hospital departments."
      >
        {loading && (
          <div className="mb-4">
            <Loader
              size="small"
              message="Refreshing departments..."
            />
          </div>
        )}

        {!loading && departments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-medium text-gray-700">
              No departments found.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try another search or add a department.
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={departments}
            rowKey="id"
            emptyMessage="No departments found."
          />
        )}

        {!loading && lastPage > 1 && (
          <div className="mt-5 border-t border-gray-200 pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={lastPage}
              onPageChange={(page) => fetchDepartments(page, search)}
            />
          </div>
        )}
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        onClose={() => {
          if (!deleting) setDepartmentToDelete(null)
        }}
        onConfirm={handleDeleteDepartment}
        title="Delete Department"
        message={
          departmentToDelete
            ? `Are you sure you want to delete "${departmentToDelete.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this department?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      />
    </div>
  )
}

export default Departments
