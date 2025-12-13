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
      const response = await apiClient.get('/api/v1/notifications/unread/count')
      const data = response?.data || response
      
      console.log('🔔 Unread count API response:', data)
      
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
      
      console.log('🔢 Setting unread count to:', count)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    const getAccessToken = () => localStorage.getItem('accessToken')
    const token = getAccessToken()

    if (!token) {
      console.warn('No access token found, skipping socket connection')
      return
    }

    // Fetch initial unread count
    fetchUnreadCount()

    // Connect to socket.io - connect to base URL without /ws namespace
    const socketInstance = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('Socket.io connected')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error)
    })

    // Listen for new notifications
    socketInstance.on('notification:new', (payload) => {
      console.log('New notification received:', payload)

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
      socketInstance.disconnect()
    }
  }, [fetchUnreadCount])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission)
      })
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
