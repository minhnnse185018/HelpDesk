import { NavLink, Outlet, useNavigate } from 'react-router-dom'

function StudentLayout() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-left" onClick={() => navigate('/student/dashboard')}>
          <div className="app-logo">FH</div>
          <div className="app-title-group">
            <span className="app-title">Facility Feedback &amp; Helpdesk</span>
            <span className="app-subtitle">Hệ thống phản ánh CSVC, WiFi, thiết bị</span>
          </div>
        </div>
        <div className="top-bar-right">
          <div className="user-info">
            <div className="user-avatar">M</div>
            <div className="user-meta">
              <span className="user-name">Minh</span>
              <span className="user-role">Student / Sinh viên</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="top-nav-links">
        <NavLink
          to="/student/dashboard"
          className={({ isActive }) =>
            `top-nav-link ${isActive ? 'top-nav-link-active' : ''}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/student/my-tickets"
          className={({ isActive }) =>
            `top-nav-link ${isActive ? 'top-nav-link-active' : ''}`
          }
        >
          My Tickets / Ticket của tôi
        </NavLink>
        <NavLink
          to="/student/create-ticket"
          className={({ isActive }) =>
            `top-nav-link ${isActive ? 'top-nav-link-active' : ''}`
          }
        >
          Create Ticket / Tạo phản ánh
        </NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default StudentLayout
