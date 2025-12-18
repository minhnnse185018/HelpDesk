import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  register,
  validateRegisterPayload,
  isValidPassword,
} from '../api/auth'
import { useCapsLockWarning } from '../hooks/useCapsLockWarning'

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
  const {
    capsLockOn: capsLockOnPassword,
    handlePasswordKeyEvent: handlePasswordKeyEventPassword,
    resetCapsLock: resetCapsPassword,
  } = useCapsLockWarning()
  const {
    capsLockOn: capsLockOnConfirm,
    handlePasswordKeyEvent: handlePasswordKeyEventConfirm,
    resetCapsLock: resetCapsConfirm,
  } = useCapsLockWarning()

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
      validationErrors.confirmPassword = 'Confirm password must be at least 8 characters'
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
      setStatusMessage('Registration successful. Please check your email/OTP to verify.')
    } catch (error) {
      setServerError(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-form-wrapper" style={{ gridColumn: '1 / -1' }}>
          <div className="login-header">
            <img src="/helpdesk.png" alt="HelpDesk" className="app-logo" style={{ width: '48px', height: '48px', borderRadius: '999px', objectFit: 'contain' }} />
            <div>
              <h1 className="login-title">Create an account</h1>
              <p className="login-subtitle">
              Register to submit and track infrastructure support requests.
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
              <label htmlFor="reg-username" className="form-label">Full Name</label>
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
              <label htmlFor="reg-phone" className="form-label">Phone Number</label>
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

            <div className="form-field" style={{ position: 'relative' }}>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handlePasswordKeyEventPassword}
                onKeyUp={handlePasswordKeyEventPassword}
                onBlur={resetCapsPassword}
                aria-invalid={Boolean(errors.password)}
                placeholder="At least 8 characters"
              />
              {capsLockOnPassword && !errors.password && (
                <span
                  className="form-error"
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '58%',
                    transform: 'translateY(-50%)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    pointerEvents: 'none',
                  }}
                >
                  CAPS LOCK ON
                </span>
              )}
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-field" style={{ position: 'relative' }}>
              <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={handleChange}
                onKeyDown={handlePasswordKeyEventConfirm}
                onKeyUp={handlePasswordKeyEventConfirm}
                onBlur={resetCapsConfirm}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {capsLockOnConfirm && !errors.confirmPassword && (
                <span
                  className="form-error"
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '58%',
                    transform: 'translateY(-50%)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    pointerEvents: 'none',
                  }}
                >
                  CAPS
                </span>
              )}
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
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="login-footer-links">
              <button
                type="button"
                className="link-button small"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>

              <button
                type="button"
                className="link-button small"
                onClick={goToVerifyPage}
              >
                Enter OTP Code
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  )
}

export default Register
