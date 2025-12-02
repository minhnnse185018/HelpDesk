// Centralized API client that reads the backend base URL from Vite env vars.
// Usage:
//   import { apiClient } from './api/client'
//   const tickets = await apiClient.get('/tickets')

const getBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/$/, '')
  }
  console.warn(
    'VITE_API_BASE_URL is not set; falling back to http://localhost:8080/api'
  )
  return 'http://localhost:8080/api'
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
  const response = await fetch(buildUrl(path), {
    method,
    body: payload,
    headers: {
      ...defaultHeaders(body),
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    const message = await response
      .text()
      .catch(() => `HTTP ${response.status}`)
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${message}`
    )
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
