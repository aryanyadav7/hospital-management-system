import { useState } from 'react'

function Register({ onRegister, onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      console.log('Register response:', data)

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Registration failed.'
        )
      }

      localStorage.setItem('token', data.data.token)
      localStorage.setItem(
        'user',
        JSON.stringify(data.data.user)
      )

      setSuccess('Registration successful.')

      if (onRegister) {
        onRegister()
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError(
        error.message || 'Unable to register.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">

        {/* Header */}
        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-blue-900">
            HMS
          </h1>

          <h2 className="text-2xl font-semibold text-gray-800 mt-4">
            Create Account
          </h2>

          <p className="text-gray-500 mt-2">
            Register for Hospital Management System
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div className="mb-4">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

          </div>

          {/* Email */}
          <div className="mb-4">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

          </div>

          {/* Password */}
          <div className="mb-6">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength="8"
              required
            />

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

        </form>

        {/* Login Link */}
        <div className="text-center mt-6">

          <p className="text-sm text-gray-600">
            Already have an account?
          </p>

          <button
            onClick={onLogin}
            className="text-blue-600 font-medium hover:underline mt-1"
          >
            Login
          </button>

        </div>

      </div>

    </div>
  )
}

export default Register