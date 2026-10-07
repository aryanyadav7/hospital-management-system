import { useEffect, useState } from 'react'

function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(true)

  const [editingDepartment, setEditingDepartment] = useState(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/departments',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      console.log('Departments response:', data)

      if (data.success) {
        setDepartments(data.data)
      }
    } catch (error) {
      console.error('Departments error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDepartment = async (e) => {
    e.preventDefault()

    try {
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
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            name,
            description,
            status,
        }),
        })

        const data = await response.json()

        console.log('Save department response:', data)

        if (data.success) {
        if (isEditing) {
            setDepartments((currentDepartments) =>
            currentDepartments.map((department) =>
                department.id === editingDepartment.id
                ? data.data
                : department
            )
            )
        } else {
            setDepartments((currentDepartments) => [
            data.data,
            ...currentDepartments,
            ])
        }

        setName('')
        setDescription('')
        setStatus(true)
        setShowForm(false)
        setEditingDepartment(null)
        }
    } catch (error) {
        console.error('Save department error:', error)
    }
    }

  const handleEditDepartment = (department) => {
    setEditingDepartment(department)

    setName(department.name)
    setDescription(department.description || '')
    setStatus(department.status)

    setShowForm(true)
    }

  const handleDeleteDepartment = async (department) => {
    const confirmed = window.confirm(
        `Are you sure you want to delete "${department.name}"?`
    )

    if (!confirmed) {
        return
    }

    try {
        const token = localStorage.getItem('token')

        const response = await fetch(
        `http://127.0.0.1:8000/api/v1/departments/${department.id}`,
        {
            method: 'DELETE',
            headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            },
        }
        )

        const data = await response.json()

        console.log('Delete department response:', data)

        if (data.success) {
        setDepartments((currentDepartments) =>
            currentDepartments.filter(
            (currentDepartment) =>
                currentDepartment.id !== department.id
            )
        )
        }
    } catch (error) {
        console.error('Delete department error:', error)
    }
    }



  if (loading) {
    return <p>Loading departments...</p>
  }

  return (
    <div>
        {/* Page Header */}
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">
            Departments
            </h1>

            <p className="mt-2 text-gray-600">
            Manage hospital departments.
            </p>
        </div>

        <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
            {showForm ? 'Cancel' : 'Add Department'}
        </button>
        </div>

        {/* Add Department Form */}
        {showForm && (
        <form
            onSubmit={handleSaveDepartment}
            className="mt-6 bg-white p-6 rounded-xl shadow-sm"
        >
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
            {editingDepartment ? 'Edit Department' : 'Add Department'}
            </h2>

            <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Name
            </label>

            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter department name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                required
            />
            </div>

            <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
            </label>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter department description"
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
            </div>

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

            <button
            type="submit"
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
            >
            {editingDepartment ? 'Update Department' : 'Save Department'}
            </button>
        </form>
        )}

        {/* Department List */}
        <div className="mt-6">
        {departments.length === 0 ? (
            <p className="text-gray-500">
            No departments found.
            </p>
        ) : (
            departments.map((department) => (
            <div
                key={department.id}
                className="bg-white p-5 rounded-lg shadow-sm mb-4"
            >
                <h2 className="text-lg font-semibold text-gray-800">
                {department.name}
                </h2>

                <p className="text-gray-600 mt-1">
                {department.description}
                </p>

                <div className="mt-4">
                    <button
                        onClick={() => handleEditDepartment(department)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                    >
                        Edit
                    </button>

                    <button
                        onClick={() => handleDeleteDepartment(department)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>

            ))
        )}
        </div>
    </div>
    )
  
}

export default Departments