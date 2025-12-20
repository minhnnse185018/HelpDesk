import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import Snowfall from 'react-snowfall'
import { formatDate } from '../../utils/ticketHelpers.jsx'
function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [kpis, setKpis] = useState([
    { label: 'Total Tickets', value: 0 },
    { label: 'On-time SLA', value: '0%' },
    { label: 'Overdue Tickets', value: 0 },
  ])
  const [categoryStats, setCategoryStats] = useState([])
  const [slaStats, setSlaStats] = useState({ onTime: 0, overdue: 0 })
  const [recentTickets, setRecentTickets] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all tickets
      const response = await apiClient.get('/api/v1/tickets')
      let data = response?.data || response

      // Normalize data to array
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data)
        if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
          data = Object.values(data)
        } else {
          data = data.tickets || data.data || data.items || []
        }
      }

      const ticketsArray = Array.isArray(data) ? data : []
      setTickets(ticketsArray)

      // Fetch overdue tickets from dedicated endpoint
      let overdueCount = 0
      try {
        const overdueResponse = await apiClient.get('/api/v1/tickets/overdue')
        let overdueData = overdueResponse?.data || overdueResponse

        // Normalize overdue data to array
        if (overdueData && typeof overdueData === 'object' && !Array.isArray(overdueData)) {
          const keys = Object.keys(overdueData)
          if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
            overdueData = Object.values(overdueData)
          } else {
            overdueData = overdueData.tickets || overdueData.data || overdueData.items || []
          }
        }

        overdueCount = Array.isArray(overdueData) ? overdueData.length : 0
      } catch (err) {
        console.warn('Failed to fetch overdue tickets from endpoint, calculating manually:', err)
        // Fallback to manual calculation
        const now = new Date()
        overdueCount = ticketsArray.filter(t => {
          if (!t.dueDate) return false
          const dueDate = new Date(t.dueDate)
          const isOverdue = dueDate < now
          const isNotCompleted = t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled'
          return isOverdue && isNotCompleted
        }).length
      }

      // Calculate KPIs
      const totalTickets = ticketsArray.length
      const overdueTickets = overdueCount
      const onTimePercentage = totalTickets > 0
        ? Math.round(((totalTickets - overdueTickets) / totalTickets) * 100)
        : 0

      setKpis([
        { label: 'Total Tickets', value: totalTickets },
        { label: 'On-time SLA', value: `${onTimePercentage}%` },
        { label: 'Overdue Tickets', value: overdueTickets },
      ])

      // Calculate category statistics
      const categoryMap = {}
      ticketsArray.forEach(ticket => {
        if (ticket.ticketCategories && Array.isArray(ticket.ticketCategories)) {
          ticket.ticketCategories.forEach(tc => {
            const catName = tc.category?.name
            if (catName) {
              categoryMap[catName] = (categoryMap[catName] || 0) + 1
            }
          })
        }
      })

      const categoryStatsArray = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6) // Top 6 categories

      setCategoryStats(categoryStatsArray)

      // Calculate SLA stats
      setSlaStats({
        onTime: totalTickets - overdueTickets,
        overdue: overdueTickets,
      })

      // Get recent tickets (last 5)
      const recentTicketsBase = ticketsArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      // Fetch room details and ticket details if needed
      const recent = await Promise.all(
        recentTicketsBase.map(async (ticket) => {
          let roomData = ticket.room || null
          let dueDate = ticket.dueDate || null

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

          // Fetch ticket details if dueDate is missing
          if (!dueDate && ticket.id) {
            try {
              const ticketRes = await apiClient.get(`/api/v1/tickets/${ticket.id}`)
              const ticketDetail = ticketRes?.data || ticketRes
              dueDate = ticketDetail.dueDate || null
            } catch (err) {
              console.error(`Failed to fetch ticket detail ${ticket.id}:`, err)
            }
          }

          return {
            id: ticket.id,
            title: ticket.title,
            category: ticket.ticketCategories?.[0]?.category?.name || 'N/A',
            room: roomData,
            status: getStatusLabel(ticket.status),
            statusKey: ticket.status,
            slaDue: dueDate ? formatDate(dueDate) : 'N/A',
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
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      overdue: 'Overdue',
      escalated: 'Escalated',
      denied: 'Denied',
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: '#e0e7ff', text: '#3730a3' },
      assigned: { bg: '#dbeafe', text: '#1e40af' },
      in_progress: { bg: '#fef3c7', text: '#92400e' },
      resolved: { bg: '#d1fae5', text: '#065f46' },
      denied: { bg: '#fee2e2', text: '#991b1b' },
      closed: { bg: '#e5e7eb', text: '#374151' },
      escalated: { bg: '#fef2f2', text: '#b91c1c' },
      overdue: { bg: '#fee2e2', text: '#dc2626' },
    }
    return colors[status] || { bg: '#f3f4f6', text: '#374151' }
  }


  const getMaxCount = () => {
    return Math.max(...categoryStats.map(c => c.count), 1)
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
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-subtitle">Overview of tickets, SLA performance and recent activity.</p>
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

      <section className="section section-grid-two">
        <div className="card chart-card">
          <h3 className="section-title">
            Tickets by Category
          </h3>
          <div className="chart-placeholder bar-chart">
            {categoryStats.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}>
                No category data available
              </div>
            ) : (
              categoryStats.map((cat) => (
                <div key={cat.name} className="bar-row">
                  <span className="bar-label">{cat.name}</span>
                  <div className="bar-track">
                    <div
                      className="bar bar-primary"
                      style={{ width: `${(cat.count / getMaxCount()) * 100}%` }}
                    />
                  </div>
                  <span className="bar-value">{cat.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}>
                    No recent tickets
                  </td>
                </tr>
              ) : (
                recentTickets.map((ticket) => {
                  const statusColor = getStatusColor(ticket.statusKey)
                  return (
                    <tr 
                      key={ticket.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
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
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            display: 'inline-block',
                          }}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td 
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Actions column - empty since click on row navigates to detail */}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Snowfall color='#ffffff' />

    </div>
  )
}

export default AdminDashboard
