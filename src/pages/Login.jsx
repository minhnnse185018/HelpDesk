import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      // Check role if needed, for now redirect to dashboard based on some logic or default
      // Assuming result contains user info or we fetch profile
      // For now, let's default to student dashboard, or check email domain
      if (email.includes('admin')) {
        navigate('/admin/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err) {
      setError(err.message)
      if (err.message.includes('verify') || err.message.includes('not verified')) {
        // Optional: redirect to verify if error indicates unverified email
        // navigate('/verify-email', { state: { email } })
      }
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
            Cơ sở vật chất hiện đại
            <br />
            Hạ tầng CSVC, WiFi, thiết bị
          </p>
        </div>

        <div className="login-form-wrapper">
          <div className="login-header">
            <div className="app-logo">FH</div>
            <div>
              <h1 className="login-title">
                Hệ thống phản ánh & Helpdesk
              </h1>
              <p className="login-subtitle">
                Hệ thống phản ánh CSVC, WiFi, thiết bị
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="form-field">
              <label htmlFor="identifier" className="form-label">
                Email
              </label>
              <input
                id="identifier"
                type="email"
                className="input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary full-width" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="login-footer-links">
              <Link to="/forgot-password" className="link-button" style={{ textDecoration: 'none' }}>
                Quên mật khẩu?
              </Link>
              <Link to="/register" className="link-button" style={{ textDecoration: 'none' }}>
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
