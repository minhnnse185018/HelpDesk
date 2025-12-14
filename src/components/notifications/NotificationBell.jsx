import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotificationSocket } from '../../context/NotificationSocketContext'

function NotificationBell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount, socket } = useNotificationSocket()
  const [isShaking, setIsShaking] = useState(false)

  // Listen for new notifications to trigger shake animation
  useEffect(() => {
    if (!socket) return

    const handleNewNotification = () => {
      setIsShaking(true)
      // Remove shake class after animation completes
      setTimeout(() => setIsShaking(false), 1000)
    }

    socket.on('notification:new', handleNewNotification)

    return () => {
      socket.off('notification:new', handleNewNotification)
    }
  }, [socket])

  const handleClick = () => {
    // Determine the correct base path based on current location
    const pathPrefix = location.pathname.startsWith('/admin') 
      ? '/admin' 
      : location.pathname.startsWith('/staff') 
      ? '/staff' 
      : '/student'
    
    navigate(`${pathPrefix}/notifications`)
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <>
      <style>
        {`
          @keyframes bellShake {
            0%, 100% { transform: rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-15deg); }
            20%, 40%, 60%, 80% { transform: rotate(15deg); }
          }
          .bell-shake {
            animation: bellShake 0.8s ease-in-out;
          }
          .badge-pop {
            animation: badgePop 0.3s ease-out;
          }
          @keyframes badgePop {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `}
      </style>
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
          className={isShaking ? 'bell-shake' : ''}
          style={{
            width: '1.5rem',
            height: '1.5rem',
            color: '#374151',
            transformOrigin: 'top center',
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
            className={isShaking ? 'badge-pop' : ''}
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
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)',
            }}
          >
            {displayCount}
          </span>
        )}
      </button>
    </>
  )
}

export default NotificationBell
