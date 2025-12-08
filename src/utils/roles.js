// Utility helpers for normalizing role values coming back from the API.
// Handles both raw strings (e.g. "student") and nested role objects
// (e.g. { name: "STUDENT" } or { roleName: "ROLE_ADMIN" }).
const normalizeString = (value, fallback = '') => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return fallback
  const upper = trimmed.toUpperCase()
  return upper.startsWith('ROLE_') ? upper.slice(5) : upper
}

export const normalizeRoleValue = (value, fallback = '') => {
  const candidate = Array.isArray(value) ? value[0] : value
  if (candidate === null || typeof candidate === 'undefined') return fallback

  if (typeof candidate === 'string') {
    return normalizeString(candidate, fallback)
  }

  if (typeof candidate === 'object') {
    const possibleKeys = ['name', 'role', 'roleName', 'code', 'authority', 'value']
    for (const key of possibleKeys) {
      const nested = candidate[key]
      if (typeof nested === 'string' && nested.trim()) {
        return normalizeString(nested, fallback)
      }
    }
  }

  if (candidate) return normalizeString(candidate, fallback)
  return fallback
}

export const getNormalizedRoleFromPayload = (payload, fallback = '') => {
  const source = payload?.data || payload
  const roleSources = [
    source?.user?.role,
    source?.user?.roles,
    source?.role,
    source?.roles,
    source?.authorities,
  ]

  for (const source of roleSources) {
    const normalized = normalizeRoleValue(source, '')
    if (normalized) return normalized
  }

  return fallback
}
