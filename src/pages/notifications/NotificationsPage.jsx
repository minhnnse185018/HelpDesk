import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useNotificationSocket } from '../../context/NotificationSocketContext'

function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, setNotifications, setUnreadCount } = useNotificationSocket()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAllRead, setMarkingAllRead] = useState(false)

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiClient.get('/api/v1/notifications')
        const data = response?.data || response
        
        // Convert to array if it's an object
        let notificationsArray = []
        if (Array.isArray(data)) {
          notificationsArray = data
        } else if (data && typeof data === 'object') {
          notificationsArray = Object.values(data)
        }
        
        setNotifications(notificationsArray)
      } catch (err) {
        console.error('Failed to load notifications:', err)
        setError(err?.message || 'Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [setNotifications])

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/v1/notifications/${notificationId}/read`)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )

      // Decrease unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      alert('Failed to mark as read: ' + (err?.message || 'Unknown error'))
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true)
      
      await apiClient.patch('/api/v1/notifications/read-all')
      
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      
      // Force update unread count to 0
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      alert('Failed to mark all as read: ' + (err?.message || 'Unknown error'))
    } finally {
      setMarkingAllRead(false)
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.ticketId) {
      // Get user role from localStorage
      const role = localStorage.getItem('role')?.toUpperCase()
      
      // Navigate based on role
      if (role === 'ADMIN') {
        navigate(`/admin/tickets/${notification.ticketId}`)
      } else if (role === 'STAFF') {
        navigate(`/staff/tickets/${notification.ticketId}`)
      } else {
        // Student - navigate to my tickets detail (assuming this route exists)
        navigate(`/student/my-tickets/${notification.ticketId}`)
      }
      
      // Mark as read when clicked
      if (!notification.isRead) {
        handleMarkAsRead(notification.id)
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="page-subtitle">View and manage your notifications</p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead || loading || notifications.every((n) => n.isRead)}
          >
            {markingAllRead ? 'Marking...' : 'Mark All as Read'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          Loading notifications...
        </div>
      )}

      {!loading && error && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderLeft: '4px solid #dc2626',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              color: '#9ca3af',
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            No notifications yet
          </p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="card"
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: notification.isRead ? '#ffffff' : '#eff6ff',
                cursor: notification.ticketId ? 'pointer' : 'default',
                transition: 'background-color 0.2s, transform 0.1s',
                border: notification.isRead ? '1px solid #e5e7eb' : '1px solid #bfdbfe',
              }}
              onMouseEnter={(e) => {
                if (notification.ticketId) {
                  e.currentTarget.style.transform = 'translateX(4px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div
                  style={{ flex: 1 }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: notification.isRead ? 500 : 700,
                        color: '#111827',
                        margin: 0,
                      }}
                    >
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span
                        style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          backgroundColor: '#3b82f6',
                          borderRadius: '999px',
                        }}
                      />
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#4b5563',
                      margin: '0.25rem 0',
                      lineHeight: '1.4',
                    }}
                  >
                    {notification.message}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    {notification.actorName && (
                      <span>By {notification.actorName}</span>
                    )}
                    <span>{formatDateTime(notification.createdAt)}</span>
                  </div>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(notification.id)
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
