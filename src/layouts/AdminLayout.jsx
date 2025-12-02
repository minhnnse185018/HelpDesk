import { NavLink, Outlet, useNavigate } from 'react-router-dom'

function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="app-shell app-shell-admin">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/admin/dashboard')}>
          <div className="app-logo">FH</div>
          <div className="app-title-group">
            <span className="app-title-short">Facility Helpdesk</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/tickets"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Tickets
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Categories
          </NavLink>
          <NavLink
            to="/admin/rooms-departments"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Rooms &amp; Departments
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            Reports
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="top-bar top-bar-admin">
          <div className="top-bar-left">
            <span className="page-title-prefix">Admin</span>
          </div>
          <div className="top-bar-right">
            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              🔔
            </button>
            <div className="user-info">
              <div className="user-avatar">A</div>
              <div className="user-meta">
                <span className="user-name">Admin</span>
                <span className="user-role">Facility Admin / Quản trị</span>
              </div>
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
