
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set the multipart boundary for FormData.
  if (options.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (originalError) {
    const error = new Error(
      'Unable to connect to the server. Please check your connection and try again.'
    )

    error.isNetworkError = true
    error.originalError = originalError

    throw error
  }

  // Handle empty responses, including HTTP 204.
  if (response.status === 204) {
    return {}
  }

  // Safely parse JSON responses.
  const responseText = await response.text()

  let data = {}

  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      data = {
        message: responseText,
      }
    }
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    )

    error.status = response.status
    error.data = data
    error.errors = data.errors || {}

    error.isValidationError = response.status === 422
    error.isAuthenticationError = response.status === 401
    error.isAuthorizationError = response.status === 403
    error.isNotFoundError = response.status === 404
    error.isServerError = response.status >= 500

    // Handle expired or invalid authentication.
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }

    throw error
  }

  return data
}

const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, options),

  post: (endpoint, body) =>
    request(endpoint, {
      method: 'POST',
      body:
        typeof FormData !== 'undefined' && body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: 'PUT',
      body:
        typeof FormData !== 'undefined' && body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: 'PATCH',
      body:
        typeof FormData !== 'undefined' && body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: 'DELETE',
    }),
}

export default api
