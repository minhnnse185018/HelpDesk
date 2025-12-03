import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

function AdminLayout() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="app-shell app-shell-admin">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/admin/dashboard')}>
          <div className="app-logo">FH</div>
          <div className="app-title-group">
            <span className="app-title-short">Helpdesk</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Bảng điều khiển
          </NavLink>
          <NavLink
            to="/admin/tickets"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Quản lý Ticket
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Danh mục
          </NavLink>
          <NavLink
            to="/admin/rooms-departments"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Phòng & Ban
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Báo cáo
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="top-bar top-bar-admin">
          <div className="top-bar-left">
            <span className="page-title-prefix">Quản trị viên</span>
          </div>
          <div className="top-bar-right">
            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              🔔
            </button>
            <div
              className="user-info"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div className="user-avatar">A</div>
              <div className="user-meta">
                <span className="user-name">Admin</span>
                <span className="user-role">Quản trị viên</span>
              </div>
              {showDropdown && (
                <div className="user-dropdown">
                  <button onClick={handleLogout} className="user-dropdown-item">
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
