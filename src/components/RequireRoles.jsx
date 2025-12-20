import { Navigate } from 'react-router-dom'

// Simple route guard that checks auth token and role in localStorage.
function RequireRoles({ allowedRoles, children }) {
  const canUseStorage =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  const accessToken = canUseStorage ? localStorage.getItem('accessToken') : null
  // Normalize role: trim whitespace, uppercase, handle array format
  const rawRole = canUseStorage ? (localStorage.getItem('role') || '') : ''
  const role = rawRole.trim().toUpperCase()

  // Normalize allowedRoles to uppercase for comparison
  const normalizedAllowedRoles = Array.isArray(allowedRoles) 
    ? allowedRoles.map(r => String(r).trim().toUpperCase())
    : []

  const isAllowed =
    accessToken && 
    role && 
    normalizedAllowedRoles.length > 0 && 
    normalizedAllowedRoles.includes(role)

  // Debug logging (có thể xóa sau khi fix xong)
  if (!isAllowed) {
    console.warn('🚫 RequireRoles: Access denied', {
      hasToken: !!accessToken,
      role: role || '(empty)',
      allowedRoles: normalizedAllowedRoles,
      currentPath: window.location.pathname,
      rawRole: rawRole || '(empty)'
    })
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RequireRoles
