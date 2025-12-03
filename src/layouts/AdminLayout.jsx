import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

function AdminLayout() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const checkNotifications = () => {
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]')
      const unread = tickets.filter(t => t.isRead === false)
      setNotifications(unread)
    }

    checkNotifications()
    // Poll every 2 seconds to check for new tickets
    const interval = setInterval(checkNotifications, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    navigate('/login')
  }

  const handleNotificationClick = (ticketId) => {
    // Mark as read
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    const updatedTickets = tickets.map(t =>
      t.id === ticketId ? { ...t, isRead: true } : t
    )
    localStorage.setItem('tickets', JSON.stringify(updatedTickets))

    // Update local state
    setNotifications(prev => prev.filter(t => t.id !== ticketId))
    setShowNotifications(false)

    // Navigate to dashboard (or ticket detail if implemented)
    navigate('/admin/dashboard')
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
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                type="button"
                className="icon-button"
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">Thông báo</div>
                  {notifications.length === 0 ? (
                    <div className="notification-empty">Không có thông báo mới</div>
                  ) : (
                    <div className="notification-list">
                      {notifications.map(ticket => (
                        <div
                          key={ticket.id}
                          className="notification-item"
                          onClick={() => handleNotificationClick(ticket.id)}
                        >
                          <div className="notification-title">Ticket mới: {ticket.title}</div>
                          <div className="notification-time">{new Date(ticket.timestamp).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div
              className="user-info"
              onClick={() => setShowDropdown(!showDropdown)}
              ref={dropdownRef}
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
