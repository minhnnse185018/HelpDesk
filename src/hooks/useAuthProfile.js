import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile } from '../api/auth'

// Fetches the current authenticated user's profile from the backend.
// Also updates localStorage for role/username so route guards can use them.
export function useAuthProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    name: '',
    role: '',
    email: '',
    phoneNumber: '',
    fullName: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    avatar: '',
  })
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUserProfile()
      const payload = response?.data || response || {}
      const roleFromApi = payload?.role?.[0] || payload?.roles?.[0]
      const normalizedRole = roleFromApi
        ? String(roleFromApi).toUpperCase()
        : ''
      const name =
        payload?.fullName ||
        payload?.username ||
        payload?.email?.split('@')?.[0] ||
        payload?.email ||
        'User'

      setProfile({
        name,
        role: normalizedRole,
        email: payload?.email || '',
        phoneNumber: payload?.phoneNumber || '',
        fullName: payload?.fullName || '',
        address: payload?.address || '',
        dateOfBirth: payload?.dateOfBirth || '',
        gender: payload?.gender || '',
        avatar: payload?.avatar || '',
      })

      if (normalizedRole) localStorage.setItem('role', normalizedRole)
      if (name) localStorage.setItem('username', name)
      if (payload?.email) localStorage.setItem('email', payload.email)
    } catch (error) {
      console.error('Failed to fetch profile:', error?.message || error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')
      localStorage.removeItem('username')
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return { profile, loading, refreshProfile }
}

export default useAuthProfile
