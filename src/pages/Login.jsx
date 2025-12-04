import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, validateLoginPayload } from '../api/auth'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(false)


  const goToVerifyPage = () => {
    navigate('/verify-email', {
      state: { email: form.email.trim() || undefined },
    })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }


  const extractErrorMessage = (error) => {
    const rawMessage = error?.message || ''
    try {
      const jsonStart = rawMessage.indexOf('{')
      if (jsonStart !== -1) {
        const parsed = JSON.parse(rawMessage.slice(jsonStart))
        if (parsed?.message) return parsed.message
      }
    } catch (err) {
      // ignore parse errors and fall back below
    }
    const parts = rawMessage.split(' - ')
    const lastPart = parts[parts.length - 1]?.trim()
    return lastPart || 'Email ho?c m?t kh?u kh?ng ch?nh x?c'
  }

  const handleStudentLogin = async (event) => {
    event.preventDefault()
    setServerError('')
    setStatusMessage('')

    const validationErrors = validateLoginPayload(form)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const response = await login({
        email: form.email.trim(),
        password: form.password,
      })

      const payload = response?.data || response
      const accessToken = payload?.accessToken
      const refreshToken = payload?.refreshToken
      const roleFromUser = payload?.user?.roles?.[0]
      const roleFromRoot = payload?.role || payload?.roles?.[0]
      const resolvedRole = roleFromUser || roleFromRoot || 'STUDENT'
      const normalizedRole = String(resolvedRole).toUpperCase()
      const usernameFromPayload =
        payload?.user?.username ||
        payload?.username ||
        payload?.user?.email?.split?.('@')?.[0] ||
        payload?.email ||
        form.email.trim()

      if (accessToken) localStorage.setItem('accessToken', accessToken)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('role', normalizedRole)
      if (usernameFromPayload) localStorage.setItem('username', usernameFromPayload)

      const destination =
        normalizedRole === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(extractErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        
        {/* Hình minh hoạ */}
        <div className="login-illustration" aria-hidden="true">
          <div className="building-shape" />
          <div className="wifi-shape" />
          <div className="tools-shape" />
          <p className="login-illustration-text">
            Cơ sở vật chất hiện đại
            <br />
            Hạ tầng, WiFi, thiết bị và nhiều hơn nữa
          </p>
        </div>

        {/* Form đăng nhập */}
        <div className="login-form-wrapper">
          <div className="login-header">
            <div className="app-logo">FH</div>
            <div>
              <h1 className="login-title">
                Hệ thống Phản Ánh CSVC & Yêu Cầu Hỗ Trợ
              </h1>
              <p className="login-subtitle">
                Gửi yêu cầu về cơ sở vật chất, WiFi và thiết bị
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleStudentLogin}>
            
            <div className="form-field">
              <label htmlFor="identifier" className="form-label">
                Email 
              </label>
              <input
                id="identifier"
                name="email"
                type="email"
                className="input"
                value={form.email}
                placeholder="minh123@university.edu"
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                placeholder="********"
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {serverError && <div className="form-error">{serverError}</div>}

            {statusMessage && !serverError && (
              <div className="form-success">{statusMessage}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary full-width"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="login-footer-links">
              <button
                type="button"
                className="link-button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Quên mật khẩu?
              </button>

              


              <button
                type="button"
                className="link-button small"
                onClick={() => navigate('/register')}
              >
                Đăng ký tài khoản
              </button>

              <button
                type="button"
                className="link-button small"
                onClick={goToVerifyPage}
              >
                Nhập mã OTP
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  )
}

export default Login
