import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/auth'

function ResetPassword() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email)
        }
    }, [location])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới không khớp.')
            return
        }

        setLoading(true)

        try {
            await authService.resetPassword(email, otp, newPassword)
            setMessage('Đặt lại mật khẩu thành công! Đang chuyển hướng...')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-form-wrapper" style={{ width: '100%' }}>
                    <div className="login-header">
                        <h1 className="login-title">Đặt lại mật khẩu</h1>
                        <p className="login-subtitle">Nhập mã OTP và mật khẩu mới.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
                        {message && <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}

                        <div className="form-field">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Mã OTP</label>
                            <input
                                type="text"
                                className="input"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Nhập 6 số OTP"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Mật khẩu mới</label>
                            <input
                                type="password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Nhập lại mật khẩu</label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
