
import { useEffect, useRef, useState } from 'react'

const API = 'http://127.0.0.1:8000/api/v1'

function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profile_photo_path: null,
    profile_photo_url: null,
  })

  const [form, setForm] = useState({
    name: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const [preview, setPreview] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const token = () => localStorage.getItem('token')

  const request = async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token()}`,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const validationErrors = data.errors
        ? Object.values(data.errors).flat().join(' ')
        : ''

      throw new Error(validationErrors || data.message || 'Request failed.')
    }

    return data
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await request('/profile')

      setProfile(data.data.user)
      setForm({
        name: data.data.user.name || '',
        email: data.data.user.email || '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      const data = await request('/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const updatedUser = data.data.user || data.data
      setProfile((previous) => ({ ...previous, ...updatedUser }))
      setForm({
        name: updatedUser.name || form.name,
        email: updatedUser.email || form.email,
      })
      localStorage.setItem(
        'user',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...updatedUser }),
      )
      setMessage(data.message || 'Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      const data = await request('/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      })

      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
      setMessage(data.message || 'Password changed successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
        setSelectedPhoto(null)
        setPreview(null)
        return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Choose a JPG, PNG, or WebP image.')
        setSelectedPhoto(null)
        setPreview(null)
        e.target.value = ''
        return
    }

    if (file.size > 2 * 1024 * 1024) {
        setError('The image must be 2 MB or smaller.')
        setSelectedPhoto(null)
        setPreview(null)
        e.target.value = ''
        return
    }

    setError('')
    setMessage('')
    setSelectedPhoto(file)
    setPreview(URL.createObjectURL(file))
    }


  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      setError('Please select a photo first.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const body = new FormData()
      body.append('photo', selectedPhoto)

      const data = await request('/profile/photo', {
        method: 'POST',
        body,
      })

      const photoData = data.data
      setProfile((previous) => ({
        ...previous,
        profile_photo_path: photoData.profile_photo_path,
        profile_photo_url: photoData.profile_photo_url,
      }))

      setSelectedPhoto(null)
      setPreview(null)

      if (fileInputRef.current) fileInputRef.current.value = ''

      setMessage(data.message || 'Profile photo uploaded successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoRemove = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const data = await request('/profile/photo', { method: 'DELETE' })

      setProfile((previous) => ({
        ...previous,
        profile_photo_path: null,
        profile_photo_url: null,
      }))
      setSelectedPhoto(null)
      setPreview(null)

      if (fileInputRef.current) fileInputRef.current.value = ''

      setMessage(data.message || 'Profile photo removed successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading profile...</p>
  }

  const photoUrl = preview || profile.profile_photo_url

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="mt-1 text-gray-500">
          Manage your personal information, password, and profile photo.
        </p>
      </div>

      {message && (
        <div role="status" className="rounded-lg bg-green-100 p-3 text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-100 p-3 text-red-800">
          {error}
        </div>
      )}

      
    <section className="rounded-xl bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800">
        Profile Photo
    </h3>

    <div className="mt-4 flex flex-wrap items-start gap-5">
        {/* Photo preview */}
        {photoUrl ? (
        <img
            src={photoUrl}
            alt="Profile preview"
            className="h-24 w-24 shrink-0 rounded-full border border-gray-200 object-cover"
        />
        ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-800">
            {profile.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
        {/* File selection */}
        <div>
            <label
            htmlFor="profile-photo"
            className="mb-2 block text-sm font-medium text-gray-700"
            >
            Choose a profile photo
            </label>

            <input
            id="profile-photo"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="block w-full max-w-md text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
        </div>

        {/* Selection status */}
        <p className="text-sm text-gray-500">
            {selectedPhoto
            ? `Selected: ${selectedPhoto.name}`
            : 'No image selected. Choose an image to enable upload.'}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
            <button
            type="button"
            onClick={handlePhotoUpload}
            disabled={!selectedPhoto || saving}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
            {saving ? 'Uploading...' : 'Upload Photo'}
            </button>

            {(profile.profile_photo_path || preview) && (
            <button
                type="button"
                onClick={handlePhotoRemove}
                disabled={saving}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Remove Photo
            </button>
            )}
        </div>

        <p className="text-xs text-gray-500">
            Supported formats: JPG, PNG, WebP. Maximum file size: 2 MB.
        </p>
        </div>
    </div>
    </section>


      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>

        <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="profile-name"
              required
              maxLength={255}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              required
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>

        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
          <div>
            <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Please wait...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default Profile
