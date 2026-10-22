
import { useEffect, useRef, useState } from 'react'

const API = 'http://127.0.0.1:8000/api/v1'
const BACKEND_URL = 'http://127.0.0.1:8000'

function getLogoUrl(path) {
  if (!path) return null

  // Accept a full URL, a storage URL, or a database-relative path.
  let cleanPath = String(path).trim()

  if (/^https?:\/\//i.test(cleanPath)) {
    try {
      const parsed = new URL(cleanPath)
      const storageIndex = parsed.pathname.indexOf('/storage/')

      if (storageIndex !== -1) {
        cleanPath = parsed.pathname.slice(storageIndex + 9)
      } else {
        return cleanPath
      }
    } catch {
      return null
    }
  }

  cleanPath = cleanPath.replace(/^\/+/, '')
  cleanPath = cleanPath.replace(/^storage\//, '')

  const encodedPath = cleanPath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `${BACKEND_URL}/storage/${encodedPath}`
}

function HospitalSettings() {
  const [settings, setSettings] = useState({
    hospital_name: '',
    email: '',
    phone: '',
    address: '',
    logo_path: null,
  })

  const [form, setForm] = useState({
    hospital_name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [logoUrl, setLogoUrl] = useState(null)
  const [preview, setPreview] = useState(null)
  const [selectedLogo, setSelectedLogo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  const request = async (url, options = {}) => {
    const token = localStorage.getItem('token')

    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const validationErrors = data.errors
        ? Object.values(data.errors).flat().join(' ')
        : ''

      throw new Error(
        validationErrors || data.message || `Request failed (${response.status}).`,
      )
    }

    return data
  }

  const clearPreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }

    setPreview(null)
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError('')
      setImageError('')

      const data = await request('/hospital-settings')
      const hospital = data.data.settings

      setSettings(hospital)

      setForm({
        hospital_name: hospital.hospital_name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        address: hospital.address || '',
      })

      setLogoUrl(getLogoUrl(hospital.logo_path))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()

    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const handleLogoSelect = (file) => {
    if (!file) return

    setError('')
    setMessage('')
    setImageError('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('The logo must be 2 MB or smaller.')
      return
    }

    clearPreview()

    const localUrl = URL.createObjectURL(file)
    previewRef.current = localUrl

    setSelectedLogo(file)
    setPreview(localUrl)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const data = await request('/hospital-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const hospital = data.data.settings

      setSettings((previous) => ({
        ...previous,
        ...hospital,
      }))

      setForm({
        hospital_name: hospital.hospital_name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        address: hospital.address || '',
      })

      setMessage(data.message || 'Hospital settings saved successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!selectedLogo) {
      setError('Please choose a logo first.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    setImageError('')

    try {
      const body = new FormData()
      body.append('logo', selectedLogo)

      const data = await request('/hospital-settings/logo', {
        method: 'POST',
        body,
      })

      const path = data.data.logo_path

      if (!path) {
        throw new Error('Upload succeeded, but the server did not return logo_path.')
      }

      // Use the database path to construct a predictable storage URL.
      const freshUrl = getLogoUrl(path)
      const urlWithCacheBust = `${freshUrl}${freshUrl.includes('?') ? '&' : '?'}v=${Date.now()}`

      setSettings((previous) => ({
        ...previous,
        logo_path: path,
      }))

      // Update the displayed image immediately after successful upload.
      setLogoUrl(urlWithCacheBust)
      setSelectedLogo(null)
      clearPreview()

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setMessage(data.message || 'Hospital logo uploaded successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoRemove = async () => {
    if (!window.confirm('Are you sure you want to remove the hospital logo?')) {
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    setImageError('')

    try {
      const data = await request('/hospital-settings/logo', {
        method: 'DELETE',
      })

      setSettings((previous) => ({
        ...previous,
        logo_path: null,
      }))

      setLogoUrl(null)
      setSelectedLogo(null)
      clearPreview()

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setMessage(data.message || 'Hospital logo removed successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelSelection = () => {
    setSelectedLogo(null)
    clearPreview()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setError('')
    setMessage('')
    setImageError('')
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
        Loading hospital settings...
      </div>
    )
  }

  const displayedLogo = preview || logoUrl

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Hospital Settings
        </h2>
        <p className="mt-1 text-gray-500">
          Manage your hospital information and branding.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Hospital logo manager */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Hospital Logo
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a logo to represent your hospital.
            </p>
          </div>

          {settings.logo_path && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Logo saved
            </span>
          )}
        </div>

        {/* Preview */}
        <div className="mt-5 flex flex-col items-center gap-4 rounded-xl bg-gray-50 p-5 sm:flex-row">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            {displayedLogo && !imageError ? (
              <img
                key={displayedLogo}
                src={displayedLogo}
                alt="Hospital logo preview"
                className="h-full w-full object-contain"
                onLoad={() => setImageError('')}
                onError={() => {
                  if (!preview) {
                    setImageError(displayedLogo)
                  }
                }}
              />
            ) : (
              <div className="text-center">
                <span className="text-3xl text-gray-300">＋</span>
                <p className="mt-1 text-xs text-gray-500">
                  {imageError ? 'Image unavailable' : 'No logo'}
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-medium text-gray-800">
              {preview
                ? 'New logo preview'
                : logoUrl
                  ? 'Current hospital logo'
                  : 'Add your hospital logo'}
            </p>

            <p className="mt-1 break-words text-sm text-gray-500">
              {selectedLogo
                ? `${selectedLogo.name} · ${(selectedLogo.size / 1024).toFixed(0)} KB`
                : 'Choose an image below to preview it before uploading.'}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG or WebP · Maximum 2 MB
            </p>
          </div>
        </div>

        {imageError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">
              The saved logo could not be loaded.
            </p>
            <p className="mt-1 break-all text-xs text-red-600">
              Image URL: {imageError}
            </p>
            <button
              type="button"
              onClick={() => window.open(imageError, '_blank', 'noopener,noreferrer')}
              className="mt-2 text-sm font-medium text-blue-700 underline"
            >
              Open image URL to diagnose
            </button>
          </div>
        )}

        {/* Drag-and-drop area */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleLogoSelect(e.dataTransfer.files?.[0])
          }}
          className={`mt-5 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <div className="text-2xl" aria-hidden="true">
            ↑
          </div>

          <p className="mt-2 text-sm font-medium text-gray-700">
            Drag and drop your logo here
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Or select a file from your computer
          </p>

          <label
            htmlFor="hospital-logo"
            className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Choose Image
          </label>

          <input
            id="hospital-logo"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleLogoSelect(e.target.files?.[0])}
            className="sr-only"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleLogoUpload}
            disabled={!selectedLogo || saving}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Please wait...' : 'Upload Logo'}
          </button>

          {selectedLogo && (
            <button
              type="button"
              onClick={cancelSelection}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel Selection
            </button>
          )}

          {settings.logo_path && (
            <button
              type="button"
              onClick={handleLogoRemove}
              disabled={saving}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {saving ? 'Please wait...' : 'Remove Logo'}
            </button>
          )}
        </div>
      </section>

      {/* Hospital information */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">
          Hospital Information
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Update the contact details displayed for your hospital.
        </p>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="hospital-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Hospital Name
            </label>
            <input
              id="hospital-name"
              required
              maxLength={255}
              value={form.hospital_name}
              onChange={(e) =>
                setForm({ ...form, hospital_name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="hospital-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="hospital-email"
              type="email"
              maxLength={255}
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="hospital-phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              id="hospital-phone"
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="hospital-address"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Address
            </label>
            <textarea
              id="hospital-address"
              rows={3}
              maxLength={2000}
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-700 px-5 py-2 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Hospital Settings'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default HospitalSettings
