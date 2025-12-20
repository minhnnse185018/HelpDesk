import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton } from '../../components/templates'
import { useNotificationSocket } from '../../context/NotificationSocketContext'
import Snowfall from 'react-snowfall'
import { formatDate } from '../../utils/ticketHelpers.jsx'

function StaffDashboard() {
  const navigate = useNavigate()
  const { socket } = useNotificationSocket()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [kpis, setKpis] = useState([
    { label: 'Total Tickets', value: 0 },
    { label: 'On-time SLA', value: '0%' },
    { label: 'Overdue Tickets', value: 0 },
  ])
  const [slaStats, setSlaStats] = useState({ onTime: 0, overdue: 0 })
  const [recentTickets, setRecentTickets] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Listen for new ticket created/assigned events (real-time update)
  useEffect(() => {
    // Get current user ID to check if ticket is assigned to this staff
    const getCurrentUserId = () => {
      try {
        return localStorage.getItem('userId')
      } catch {
        return null
      }
    }

    // Helper function to update dashboard when new ticket is assigned
    const updateDashboardWithNewTicket = async (ticketData) => {
      if (!ticketData || !ticketData.id) return

      try {
        // Fetch full ticket details
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`)
        const fullTicket = ticketRes?.data || ticketRes

        // Check if ticket is assigned to current staff
        const currentUserId = getCurrentUserId()
        const isAssignedToMe = fullTicket.assignee?.id === currentUserId || 
                              fullTicket.assigneeId === currentUserId ||
                              fullTicket.assignee?.userId === currentUserId

        if (isAssignedToMe) {
          // Reload dashboard data to get updated KPIs and recent tickets
          await loadDashboardData()
        }
      } catch (err) {
        console.error('Failed to update dashboard with new ticket:', err)
      }
    }

    // Listen for custom window event (from CreateTicket or AssignTicket)
    const handleTicketCreated = async (event) => {
      await updateDashboardWithNewTicket(event.detail)
    }

    // Listen for ticket assigned event (when admin assigns ticket to staff)
    const handleTicketAssigned = async (event) => {
      const ticketData = event.detail || event
      await updateDashboardWithNewTicket(ticketData)
    }

    // Listen for socket event from server
    const handleSocketTicketCreated = async (ticketData) => {
      await updateDashboardWithNewTicket(ticketData)
    }

    const handleSocketTicketAssigned = async (ticketData) => {
      await updateDashboardWithNewTicket(ticketData)
    }

    // Register event listeners
    window.addEventListener('ticket:created', handleTicketCreated)
    window.addEventListener('ticket:assigned', handleTicketAssigned)
    
    if (socket) {
      socket.on('ticket:created', handleSocketTicketCreated)
      socket.on('ticket:assigned', handleSocketTicketAssigned)
    }

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated)
      window.removeEventListener('ticket:assigned', handleTicketAssigned)
      if (socket) {
        socket.off('ticket:created', handleSocketTicketCreated)
        socket.off('ticket:assigned', handleSocketTicketAssigned)
      }
    }
  }, [socket])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/v1/tickets/assigned-to-me')
      
      let data = response?.data?.data || response?.data || response
      
      // Normalize data to array
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data)
        if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
          data = Object.values(data)
        } else {
          data = data.tickets || data.items || []
        }
      }
      
      const ticketsArray = Array.isArray(data) ? data : []
      setTickets(ticketsArray)
      
      // Calculate KPIs
      const totalTickets = ticketsArray.length
      const now = new Date()
      const overdueTickets = ticketsArray.filter(t => {
        if (!t.dueDate) return false
        return new Date(t.dueDate) < now && t.status !== 'resolved' && t.status !== 'closed'
      }).length
      const onTimePercentage = totalTickets > 0 
        ? Math.round(((totalTickets - overdueTickets) / totalTickets) * 100)
        : 0
      
      setKpis([
        { label: 'Total Tickets', value: totalTickets },
        { label: 'On-time SLA', value: `${onTimePercentage}%` },
        { label: 'Overdue Tickets', value: overdueTickets },
      ])
      
      // Calculate SLA stats
      setSlaStats({
        onTime: totalTickets - overdueTickets,
        overdue: overdueTickets,
      })
      
      // Get recent tickets (last 5)
      const recentTicketsBase = ticketsArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      
      // Fetch room details if needed
      const recent = await Promise.all(
        recentTicketsBase.map(async (ticket) => {
          let roomData = ticket.room || null
          
          // Fetch room details if roomId exists and room data is incomplete
          if (ticket.roomId && (!roomData?.code || !roomData?.floor)) {
            try {
              const roomRes = await apiClient.get(`/api/v1/rooms/${ticket.roomId}`)
              // Handle nested response structure
              roomData = roomRes?.data?.data || roomRes?.data || roomRes
            } catch (err) {
              console.error(`Failed to fetch room ${ticket.roomId}:`, err)
            }
          }
          
          return {
            id: ticket.id,
            title: ticket.title,
            category: ticket.ticketCategories?.[0]?.category?.name || 'N/A',
            room: roomData,
            status: getStatusLabel(ticket.status),
            statusKey: ticket.status,
            slaDue: ticket.dueDate ? formatDate(ticket.dueDate) : 'N/A',
          }
        })
      )
      
      setRecentTickets(recent)
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      assigned: 'Assigned',
      accepted: 'Accepted',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      cancelled: 'Cancelled',
      escalated: 'Escalated',
    }
    return labels[status] || status
  }
  

  if (loading) {
    return (
      <div className="page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Loading Dashboard...
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Fetching ticket statistics
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Snowfall color='#82C3D9' />
      <div className="page-header">
        <div>
          <h2 className="page-title">Staff Dashboard</h2>
          <p className="page-subtitle">
            Overview of tickets assigned to you, SLA performance and recent activity.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="cards-grid">
          {kpis.map((item) => (
            <div key={item.label} className="card kpi-card">
              <p className="kpi-label">{item.label}</p>
              <p className="kpi-value">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card chart-card">
          <h3 className="section-title">
            SLA Status
          </h3>
          <div className="chart-placeholder donut-chart">
            <div className="donut" />
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot legend-dot-green" />
                <span>On-time: {slaStats.onTime}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot-red" />
                <span>Overdue: {slaStats.overdue}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">
              Recent Tickets
            </h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket Title</th>
                <th>Category</th>
                <th>Room</th>
                <th>Status</th>
                <th>SLA Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}>
                    No recent tickets
                  </td>
                </tr>
              ) : (
                recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div style={{ 
                        fontWeight: 500, 
                        color: '#111827',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {ticket.title || ticket.id}
                      </div>
                    </td>
                    <td>{ticket.category}</td>
                    <td>
                      {ticket.room ? (
                        <div>
                          <div style={{ fontWeight: 500, color: '#111827' }}>
                            {ticket.room.name || 'N/A'}
                          </div>
                          {(ticket.room.code || ticket.room.floor) && (
                            <div style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: '#6b7280' }}>
                              {ticket.room.code && `(${ticket.room.code})`}
                              {ticket.room.code && ticket.room.floor && ' - '}
                              {ticket.room.floor && `Floor ${ticket.room.floor}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${ticket.statusKey}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.slaDue}</td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Actions column - empty since click on row navigates to detail */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Snowfall color='#ffffff' />
    </div>
  )
}

export default StaffDashboard
