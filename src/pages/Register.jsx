import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  register,
  validateRegisterPayload,
  isValidPassword,
} from '../api/auth'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phoneNumber: '',
  })
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    setStatusMessage('')

    const validationErrors = validateRegisterPayload(form)
    if (!isValidPassword(form.confirmPassword, 8)) {
      validationErrors.confirmPassword = 'Xác nhận mật khẩu phải có ít nhất 8 ký tự'
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })
      setStatusMessage('Đăng ký thành công. Vui lòng kiểm tra email/OTP để xác minh.')
    } catch (error) {
      setServerError(error.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-form-wrapper" style={{ gridColumn: '1 / -1' }}>
          <div className="login-header">
            <div className="app-logo">FH</div>
            <div>
              <h1 className="login-title">Tạo tài khoản</h1>
              <p className="login-subtitle">
                Đăng ký để gửi và theo dõi yêu cầu hỗ trợ CSVC
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>

            <div className="form-field">
              <label htmlFor="reg-email" className="form-label">Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="input"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="reg-username" className="form-label">Họ và tên</label>
              <input
                id="reg-username"
                name="username"
                type="text"
                className="input"
                value={form.username}
                onChange={handleChange}
                aria-invalid={Boolean(errors.username)}
              />
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="reg-phone" className="form-label">Số điện thoại</label>
              <input
                id="reg-phone"
                name="phoneNumber"
                type="tel"
                className="input"
                value={form.phoneNumber}
                onChange={handleChange}
                aria-invalid={Boolean(errors.phoneNumber)}
                placeholder="0123456789"
              />
              {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="reg-password" className="form-label">Mật khẩu</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                placeholder="Ít nhất 8 ký tự"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="reg-confirm" className="form-label">Xác nhận mật khẩu</label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
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
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            <div className="login-footer-links">
              <button
                type="button"
                className="link-button small"
                onClick={() => navigate('/login')}
              >
                Quay lại đăng nhập
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

export default Register
