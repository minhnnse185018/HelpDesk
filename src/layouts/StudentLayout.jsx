import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

function StudentLayout() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    // Implement logout logic here (e.g., clear tokens)
    navigate('/login')
  }

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
          <div
            className="user-info"
            onClick={() => setShowDropdown(!showDropdown)}
            ref={dropdownRef}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="user-avatar">M</div>
            <div className="user-meta">
              <span className="user-name">Minh</span>
              <span className="user-role">Sinh viên</span>
            </div>
            {showDropdown && (
              <div className="user-dropdown">
                <button onClick={() => navigate('/student/my-tickets')} className="user-dropdown-item">
                  Ticket của tôi
                </button>
                <button onClick={handleLogout} className="user-dropdown-item">
                  Đăng xuất
                </button>
              </div>
            )}
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
          Bảng điều khiển
        </NavLink>
        <NavLink
          to="/student/my-tickets"
          className={({ isActive }) =>
            `top-nav-link ${isActive ? 'top-nav-link-active' : ''}`
          }
        >
          Ticket của tôi
        </NavLink>
        <NavLink
          to="/student/create-ticket"
          className={({ isActive }) =>
            `top-nav-link ${isActive ? 'top-nav-link-active' : ''}`
          }
        >
          Tạo phản ánh
        </NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default StudentLayout
