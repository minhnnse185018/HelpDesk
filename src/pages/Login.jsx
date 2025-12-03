import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()

  const handleStudentLogin = (event) => {
    event.preventDefault()
    navigate('/student/dashboard')
  }

  const handleAdminLogin = (event) => {
    event.preventDefault()
    navigate('/admin/dashboard')
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

          <form className="login-form" onSubmit={handleStudentLogin}>
            <div className="form-field">
              <label htmlFor="identifier" className="form-label">
                Email hoặc MSSV
              </label>
              <input
                id="identifier"
                type="text"
                className="input"
                placeholder="minh123@university.edu"
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
              />
            </div>

            <button type="submit" className="btn btn-primary full-width">
              Đăng nhập
            </button>

            <div className="login-footer-links">
              <button type="button" className="link-button">
                Quên mật khẩu?
              </button>
              <button
                type="button"
                className="link-button small"
                onClick={handleAdminLogin}
              >
                Đăng nhập quản trị
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
