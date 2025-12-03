import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/auth'

function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        try {
            await authService.forgotPassword(email)
            setMessage('Mã OTP đã được gửi đến email của bạn.')
            setTimeout(() => navigate('/reset-password', { state: { email } }), 1500)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-illustration" aria-hidden="true">
                    <div className="building-shape" />
                    <div className="wifi-shape" />
                    <div className="tools-shape" />
                    <p className="login-illustration-text">
                        Khôi phục quyền truy cập
                        <br />
                        Đặt lại mật khẩu dễ dàng và bảo mật
                    </p>
                </div>

                <div className="login-form-wrapper">
                    <div className="login-header">
                        <div className="app-logo">FH</div>
                        <div>
                            <h1 className="login-title">Quên mật khẩu</h1>
                            <p className="login-subtitle">Nhập email để nhận mã OTP đặt lại mật khẩu.</p>
                        </div>
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

                        <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>

                        <div className="login-footer-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            <Link to="/login" className="link-button" style={{ textDecoration: 'none' }}>
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
