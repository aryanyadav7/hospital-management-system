import { useEffect, useState } from 'react'

function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(true)

  const [editingDepartment, setEditingDepartment] = useState(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  // Fetch departments
  const fetchDepartments = async (page = 1) => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')

      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/departments?page=${page}&search=${encodeURIComponent(search)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      console.log('Departments response:', data)

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load departments.'
        )
      }

      setDepartments(data.data.data)
      setCurrentPage(data.data.current_page)
      setLastPage(data.data.last_page)
    } catch (error) {
      console.error('Departments error:', error)
      setError(error.message || 'Unable to load departments.')
    } finally {
      setLoading(false)
    }
  }

  // Create / Update department
  const handleSaveDepartment = async (e) => {
    e.preventDefault()

    try {
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token')

      const isEditing = editingDepartment !== null

      const url = isEditing
        ? `http://127.0.0.1:8000/api/v1/departments/${editingDepartment.id}`
        : 'http://127.0.0.1:8000/api/v1/departments'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          status,
        }),
      })

      const data = await response.json()

      console.log('Save department response:', data)

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to save department.'
        )
      }

      setSuccess(
        isEditing
          ? 'Department updated successfully.'
          : 'Department created successfully.'
      )

      setName('')
      setDescription('')
      setStatus(true)
      setShowForm(false)
      setEditingDepartment(null)

      await fetchDepartments(isEditing ? currentPage : 1)
    } catch (error) {
      console.error('Save department error:', error)
      setError(error.message || 'Unable to save department.')
    }
  }

  // Edit department
  const handleEditDepartment = (department) => {
    setEditingDepartment(department)
    setName(department.name)
    setDescription(department.description || '')
    setStatus(department.status)
    setShowForm(true)
  }

  // Delete department
  const handleDeleteDepartment = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token')

      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/departments/${department.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      console.log('Delete department response:', data)

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to delete department.'
        )
      }

      setSuccess('Department deleted successfully.')

      // Refresh the current page from the API
      await fetchDepartments(currentPage)
    } catch (error) {
      console.error('Delete department error:', error)
      setError(error.message || 'Unable to delete department.')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-600">
          Loading departments...
        </p>
      </div>
    )
  }

  return (
    <div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Departments
          </h1>

          <p className="mt-2 text-gray-600">
            Manage hospital departments.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm)

            if (showForm) {
              setEditingDepartment(null)
              setName('')
              setDescription('')
              setStatus(true)
            }
          }}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Department'}
        </button>

      </div>

      {/* Search */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              fetchDepartments(1)
            }
          }}
          placeholder="Search departments..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => fetchDepartments(1)}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>

        {search && (
          <button
            onClick={() => {
              setSearch('')
              fetchDepartments(1)
            }}
            className="bg-gray-500 text-white px-5 py-3 rounded-lg hover:bg-gray-600"
          >
            Clear
          </button>
        )}

      </div>

      {/* Add / Edit Department Form */}
      {showForm && (
        <form
          onSubmit={handleSaveDepartment}
          className="mt-6 bg-white p-6 rounded-xl shadow-sm"
        >

          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            {editingDepartment
              ? 'Edit Department'
              : 'Add Department'}
          </h2>

          {/* Department Name */}
          <div className="mb-4">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter department name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

          </div>

          {/* Description */}
          <div className="mb-4">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter department description"
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Status */}
          <div className="mb-5">

            <label className="flex items-center gap-2">

              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
              />

              <span className="text-sm text-gray-700">
                Active
              </span>

            </label>

          </div>

          {/* Save / Update */}
          <button
            type="submit"
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
          >
            {editingDepartment
              ? 'Update Department'
              : 'Save Department'}
          </button>

        </form>
      )}

      {/* Department List */}
      <div className="mt-6">

        {departments.length === 0 ? (

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500">
              No departments found.
            </p>
          </div>

        ) : (

          departments.map((department) => (

            <div
              key={department.id}
              className="bg-white p-5 rounded-lg shadow-sm mb-4"
            >

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                <div>

                  <h2 className="text-lg font-semibold text-gray-800">
                    {department.name}
                  </h2>

                  <p className="text-gray-600 mt-1">
                    {department.description ||
                      'No description available.'}
                  </p>

                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      department.status
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {department.status ? 'Active' : 'Inactive'}
                  </span>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      handleEditDepartment(department)
                    }
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteDepartment(department)
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          ))

        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">

            <button
              onClick={() => fetchDepartments(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-gray-700">
              Page {currentPage} of {lastPage}
            </span>

            <button
              onClick={() => fetchDepartments(currentPage + 1)}
              disabled={currentPage === lastPage}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Next
            </button>

          </div>
        )}

      </div>

    </div>
  )
}

export default Departments