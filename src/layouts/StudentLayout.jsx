import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import { useAuthProfile } from '../hooks/useAuthProfile'
import ProfileModal from '../components/ProfileModal'

function StudentLayout() {
  // const navigate = useNavigate()
  // const { profile, refreshProfile } = useAuthProfile()
  // const displayName = profile.name || 'User'
  // const displayRole = profile.role
  //   ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
  //   : 'Student'
  // const displayAvatar = displayName.charAt(0).toUpperCase() || 'U'
  // const [showProfileModal, setShowProfileModal] = useState(false)

  // const handleLogout = async () => {
    // const refreshToken = localStorage.getItem('refreshToken')
    // try {
    //   if (refreshToken) await logout({ refreshToken })
    // } catch (error) {
    //   // Ignore logout API errors; still clear client state.
    //   console.error('Logout failed:', error?.message || error)
    // }
    // localStorage.removeItem('accessToken')
    // localStorage.removeItem('refreshToken')
    // localStorage.removeItem('role')
    // localStorage.removeItem('username')
    // navigate('/login', { replace: true })
  // }

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
          <div className="user-info" onClick={() => setShowProfileModal(true)}>
            <div className="user-avatar">{displayAvatar}</div>
            <div className="user-meta">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{displayRole}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
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
        <Outlet context={{ profile }} />
      </main>

      {/* <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdated={refreshProfile}
      /> */}
    </div>
  )
}

export default StudentLayout
