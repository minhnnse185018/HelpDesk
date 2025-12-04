import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  resendOtp,
  validateResendOtpPayload,
  validateVerifyEmailPayload,
  verifyEmail,
} from '../api/auth'

function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialEmail = location.state?.email || ''

  const [form, setForm] = useState({ email: initialEmail, otp: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    setStatusMessage('')

    const validationErrors = validateVerifyEmailPayload(form)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await verifyEmail({
        email: form.email.trim(),
        otp: form.otp.trim(),
      })
      setStatusMessage(
        'Xac minh thanh cong. Dang chuyen toi trang dang nhap...'
      )
      setTimeout(() => navigate('/login', { replace: true }), 800)
    } catch (error) {
      setServerError(error.message || 'Xac minh that bai')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setServerError('')
    setStatusMessage('')

    const validationErrors = validateResendOtpPayload({ email: form.email })
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setResendLoading(true)
    try {
      await resendOtp({ email: form.email.trim() })
      setStatusMessage('Da gui lai ma OTP. Vui long kiem tra email.')
    } catch (error) {
      setServerError(error.message || 'Khong gui duoc OTP')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-form-wrapper" style={{ gridColumn: '1 / -1' }}>
          <div className="login-header">
            <div className="app-logo">FH</div>
            <div>
              <h1 className="login-title">Xac minh email</h1>
              <p className="login-subtitle">
                Nhap ma OTP da gui ve email de kich hoat tai khoan
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="verify-email" className="form-label">
                Email
              </label>
              <input
                id="verify-email"
                name="email"
                type="email"
                className="input"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                placeholder="example@domain.com"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="verify-otp" className="form-label">
                Ma OTP
              </label>
              <input
                id="verify-otp"
                name="otp"
                type="text"
                className="input"
                value={form.otp}
                onChange={handleChange}
                aria-invalid={Boolean(errors.otp)}
                placeholder="Nhap ma 6 chu so"
              />
              {errors.otp && <span className="form-error">{errors.otp}</span>}
            </div>

            {serverError && <div className="form-error">{serverError}</div>}
            {statusMessage && !serverError && (
              <div className="form-success">{statusMessage}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary full-width"
              disabled={loading || resendLoading}
            >
              {loading ? 'Dang xac minh...' : 'Xac minh tai khoan'}
            </button>

            <button
              type="button"
              className="btn btn-secondary full-width"
              onClick={handleResendOtp}
              disabled={loading || resendLoading}
            >
              {resendLoading ? 'Dang gui lai...' : 'Gui lai ma OTP'}
            </button>

            <div className="login-footer-links">
              <button
                type="button"
                className="link-button small"
                onClick={() => navigate('/login')}
              >
                Quay lai trang dang nhap
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
