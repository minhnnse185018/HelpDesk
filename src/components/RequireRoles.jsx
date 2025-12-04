import { Navigate } from 'react-router-dom'

// Simple route guard that checks auth token and role in localStorage.
function RequireRoles({ allowedRoles, children }) {
  const canUseStorage =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  const accessToken = canUseStorage ? localStorage.getItem('accessToken') : null
  const role = canUseStorage
    ? (localStorage.getItem('role') || '').toUpperCase()
    : ''

  const isAllowed =
    accessToken && Array.isArray(allowedRoles) && allowedRoles.includes(role)

  if (!isAllowed) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RequireRoles
