const API_URL = 'https://system-helpdesk-request.onrender.com/api/v1/auth'

const getHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}

export const authService = {
    register: async (data) => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Registration failed')
        return result
    },

    verifyEmail: async (email, otp) => {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Verification failed')
        return result
    },

    resendOtp: async (email) => {
        const response = await fetch(`${API_URL}/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to resend OTP')
        return result
    },

    login: async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Login failed')

        if (result.accessToken) {
            localStorage.setItem('accessToken', result.accessToken)
            localStorage.setItem('refreshToken', result.refreshToken)
        }
        return result
    },

    logout: async () => {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: getHeaders()
            })
        } catch (error) {
            console.error('Logout failed', error)
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        }
    },

    forgotPassword: async (email) => {
        const response = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Request failed')
        return result
    },

    resetPassword: async (email, otp, newPassword) => {
        const response = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Reset password failed')
        return result
    },

    getProfile: async () => {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: getHeaders()
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to fetch profile')
        return result
    },

    refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Refresh failed')

        if (result.accessToken) {
            localStorage.setItem('accessToken', result.accessToken)
            if (result.refreshToken) {
                localStorage.setItem('refreshToken', result.refreshToken)
            }
        }
        return result
    }
}
