
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set Content-Type for FormData uploads.
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    )

    error.status = response.status
    error.data = data

    throw error
  }

  return data
}

const api = {
  get: (endpoint) => request(endpoint),

  post: (endpoint, body) =>
    request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}

export default api
