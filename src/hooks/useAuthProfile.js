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
    // Kiểm tra token trước khi fetch profile
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.warn('⚠️ No access token found, skipping profile fetch')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await getUserProfile()
      const payload = response?.data || response || {}
      // Handle both string and array role formats
      const roleFromApi = Array.isArray(payload?.role) 
        ? payload.role[0]
        : payload?.role || payload?.roles?.[0]
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
      
      // Kiểm tra lại token sau khi có lỗi - có thể token đã bị xóa bởi process khác
      const currentToken = localStorage.getItem('accessToken')
      if (!currentToken) {
        console.log('🚪 Token was removed, redirecting to login...')
        navigate('/login', { replace: true })
        return
      }
      
      // Chỉ xóa token và redirect về login nếu thực sự là lỗi authentication (401/403)
      // Với các lỗi khác (network, 500, etc.) thì giữ nguyên token để retry sau
      const errorStatus = error?.response?.status
      if (errorStatus === 401 || errorStatus === 403) {
        console.log('🚪 Authentication failed (401/403), logging out...')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('role')
        localStorage.removeItem('username')
        navigate('/login', { replace: true })
      } else {
        // Với lỗi khác (network, 500, etc.), chỉ log warning và giữ nguyên session
        console.warn('⚠️ Profile fetch failed but keeping session (will retry later)')
        // Set profile mặc định từ localStorage nếu có
        const storedRole = localStorage.getItem('role')
        const storedUsername = localStorage.getItem('username')
        const storedEmail = localStorage.getItem('email')
        if (storedRole) {
          setProfile(prev => ({
            ...prev,
            role: storedRole,
            name: storedUsername || prev.name,
            email: storedEmail || prev.email
          }))
        }
      }
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
