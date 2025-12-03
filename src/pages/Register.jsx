import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/auth'

function Register() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { id, value } = e.target
        setFormData(prev => ({
            ...prev,
            [id]: value
        }))
        // Clear error when user types
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Basic Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp.')
            return
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.')
            return
        }

        setLoading(true)

        try {
            await authService.register({
                email: formData.email,
                password: formData.password,
                username: formData.username,
                phoneNumber: formData.phoneNumber
            })

            // Success
            alert('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.')
            navigate('/verify-email', { state: { email: formData.email } })

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
                        Tham gia cùng chúng tôi
                        <br />
                        Góp phần xây dựng môi trường tốt đẹp hơn
                    </p>
                </div>

                <div className="login-form-wrapper">
                    <div className="login-header">
                        <div className="app-logo">FH</div>
                        <div>
                            <h1 className="login-title">
                                Đăng ký tài khoản
                            </h1>
                            <p className="login-subtitle">
                                Tạo tài khoản để gửi phản ánh
                            </p>
                        </div>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
                                {error}
                            </div>
                        )}

                        <div className="form-field">
                            <label htmlFor="username" className="form-label">
                                Họ và tên
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="input"
                                placeholder="Nguyễn Văn A"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="phoneNumber" className="form-label">
                                Số điện thoại
                            </label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                className="input"
                                placeholder="0901234567"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="password" className="form-label">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirmPassword" className="form-label">
                                Nhập lại mật khẩu
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary full-width"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>

                        <div className="login-footer-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Đã có tài khoản?{' '}
                                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
                                    Đăng nhập ngay
                                </Link>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register
