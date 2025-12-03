import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken')
            if (token) {
                try {
                    // Try to get profile
                    const profile = await authService.getProfile()
                    setUser(profile)
                } catch (error) {
                    console.error('Auth init failed:', error)
                    // If profile fetch fails (e.g. 401), try refresh
                    try {
                        await authService.refreshToken()
                        const profile = await authService.getProfile()
                        setUser(profile)
                    } catch (refreshError) {
                        // If refresh also fails, logout
                        localStorage.removeItem('accessToken')
                        localStorage.removeItem('refreshToken')
                        setUser(null)
                    }
                }
            }
            setLoading(false)
        }

        initAuth()
    }, [])

    const login = async (email, password) => {
        const result = await authService.login(email, password)
        // After login, fetch profile to get user details
        const profile = await authService.getProfile()
        setUser(profile)
        return result
    }

    const logout = async () => {
        await authService.logout()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
