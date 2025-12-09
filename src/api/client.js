// Centralized API client that reads the backend base URL from Vite env vars.
// Usage:
//   import { apiClient } from './api/client'
//   const tickets = await apiClient.get('/tickets')

const getBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.trim().replace(/\/$/, '')
  }
  console.warn(
    'VITE_API_BASE_URL is not set; falling back to http://localhost:3001'
  )
  return 'http://localhost:3001'
}


const buildUrl = (path) => {
  const normalizedPath = String(path || '').replace(/^\//, '')
  return `${getBaseUrl()}/${normalizedPath}`
}

const prepareBody = (body) => {
  if (!body) return undefined
  if (body instanceof FormData) return body
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

const getAccessToken = () => {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem('accessToken')
  } catch (_err) {
    return null
  }
}

const defaultHeaders = (body) =>
  body instanceof FormData
    ? {}
    : {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }

async function request(path, options = {}) {
  const { method = 'GET', headers, body, ...rest } = options
  const payload = prepareBody(body)
  const url = buildUrl(path)
  const token = getAccessToken()

  let response
  try {
    response = await fetch(url, {
      method,
      body: payload,
      headers: {
        ...defaultHeaders(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...rest,
    })
  } catch (err) {
    // Typically CORS or network issues
    throw new Error(`Network error calling ${url}: ${err.message}`)
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    let apiMessage = ''

    if (contentType.includes('application/json')) {
      try {
        const data = await response.json()
        apiMessage =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : '') ||
          ''
      } catch (_) {
        apiMessage = ''
      }
    }

    if (!apiMessage) {
      apiMessage = await response.text().catch(() => '')
    }

    const finalMessage =
      apiMessage?.toString().trim() ||
      response.statusText ||
      `HTTP ${response.status}` ||
      'Error'

    throw new Error(finalMessage)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) =>
    request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export const API_BASE_URL = getBaseUrl()
