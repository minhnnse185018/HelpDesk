import { useNavigate } from 'react-router-dom'
import { useNotificationSocket } from '../../context/NotificationSocketContext'

function NotificationBell() {
  const navigate = useNavigate()
  const { unreadCount } = useNotificationSocket()

  const handleClick = () => {
    navigate('/notifications')
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '0.5rem',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '0.375rem',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      title="Notifications"
    >
      {/* Bell Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{
          width: '1.5rem',
          height: '1.5rem',
          color: '#374151',
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>

      {/* Badge */}
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '1.25rem',
            height: '1.25rem',
            padding: '0 0.25rem',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#dc2626',
            borderRadius: '999px',
            border: '2px solid #ffffff',
          }}
        >
          {displayCount}
        </span>
      )}
    </button>
  )
}

export default NotificationBell
