import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { apiClient, API_BASE_URL } from '../api/client'

const NotificationSocketContext = createContext(null)

export function useNotificationSocket() {
  const context = useContext(NotificationSocketContext)
  if (!context) {
    throw new Error('useNotificationSocket must be used within NotificationSocketProvider')
  }
  return context
}

export function NotificationSocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        return
      }

      const response = await apiClient.get('/api/v1/notifications/unread/count')
      const data = response?.data || response
      
      // Handle different response formats
      let count = 0
      if (typeof data === 'number') {
        count = data
      } else if (data && typeof data.count === 'number') {
        count = data.count
      } else if (data && typeof data === 'object') {
        // If data is object, check all possible keys
        count = data.count || data.unreadCount || data.total || 0
      }
      
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      setUnreadCount(0)
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    const getAccessToken = () => localStorage.getItem('accessToken')
    const token = getAccessToken()

    if (!token) {
      return
    }

    // Fetch initial unread count with small delay to ensure token is ready
    const fetchTimer = setTimeout(() => {
      fetchUnreadCount()
    }, 100)

    // Also fetch again after 1 second as backup
    const retryTimer = setTimeout(() => {
      fetchUnreadCount()
    }, 1000)

    // Connect to socket.io - connect to base URL without /ws namespace
    const socketInstance = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      // Re-fetch unread count when socket reconnects
      fetchUnreadCount()
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error)
    })

    // Listen for new notifications
    socketInstance.on('notification:new', (payload) => {
      // Prepend to notifications array
      setNotifications((prev) => [payload, ...prev])

      // Increment unread count
      setUnreadCount((prev) => prev + 1)

      // Optional: Show browser notification
if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.message,
          icon: '/favicon.ico',
        })
      }
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      clearTimeout(fetchTimer)
      clearTimeout(retryTimer)
      socketInstance.disconnect()
    }
  }, [fetchUnreadCount])

  // Listen for login success to refresh unread count
  useEffect(() => {
    const handleLoginSuccess = () => {
      // Wait a bit for token to be properly set
      setTimeout(() => {
        fetchUnreadCount()
      }, 500)
    }

    window.addEventListener('auth-login-success', handleLoginSuccess)
    
    return () => {
      window.removeEventListener('auth-login-success', handleLoginSuccess)
    }
  }, [fetchUnreadCount])

  // Listen for userId changes to reset notifications
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userId' && e.newValue !== e.oldValue) {
        setNotifications([])
        setUnreadCount(0)
        // Fetch new user's unread count
        setTimeout(() => {
          fetchUnreadCount()
        }, 500)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchUnreadCount])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const value = {
    socket,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    isConnected,
    fetchUnreadCount,
  }

  return (
    <NotificationSocketContext.Provider value={value}>
      {children}
    </NotificationSocketContext.Provider>
  )
}