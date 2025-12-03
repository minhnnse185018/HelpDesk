import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/auth'

function VerifyEmail() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email)
        }
    }, [location])

    const handleVerify = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        try {
            await authService.verifyEmail(email, otp)
            setMessage('Xác thực thành công! Đang chuyển hướng...')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        try {
            await authService.resendOtp(email)
            setMessage('Đã gửi lại mã OTP.')
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-form-wrapper" style={{ width: '100%' }}>
                    <div className="login-header">
                        <h1 className="login-title">Xác thực Email</h1>
                        <p className="login-subtitle">Nhập mã OTP đã được gửi đến email của bạn.</p>
                    </div>

                    <form className="login-form" onSubmit={handleVerify}>
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

                        <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                            {loading ? 'Đang xác thực...' : 'Xác thực'}
                        </button>

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <button type="button" className="link-button" onClick={handleResend}>
                                Gửi lại mã OTP
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail
