import { useOutletContext } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton } from '../../components/templates'
import Snowfall from 'react-snowfall'
import { formatDate, getStatusColor, getStatusBadge } from '../../utils/ticketHelpers.jsx'

function StudentDashboard() {
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const profile = outletContext.profile || {}

  const nameFromStorage =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('username') || localStorage.getItem('email')
      : ''

  const displayName = profile.name || nameFromStorage || 'User'
  const displayRole = profile.role || 'Student'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/api/v1/tickets/my-tickets')
        const data = response?.data || {}
        const list = Array.isArray(data)
          ? data
          : Object.values(data).filter(Boolean)

        setTickets(list)
        setError('')
      } catch (err) {
        setError(err?.message || 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // Statistics
  const stats = {
    open: 0,
    inProgress: 0,
    resolved: 0,
  }

  tickets.forEach((t) => {
    if (t.status === 'open') stats.open++
    // Only count accepted/in_progress as In Progress for dashboard
    if (t.status === 'accepted' || t.status === 'in_progress')
      stats.inProgress++
    if (t.status === 'resolved') stats.resolved++
  })

  const overviewStats = [
    { label: 'Open Tickets', value: stats.open },
    { label: 'In Progress', value: stats.inProgress },
    { label: 'Resolved', value: stats.resolved },
  ]

  const filters = ['All', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Overdue']

  // Map status to display label and status key for getStatusColor
  const getStatusDisplay = (status) => {
    if (status === 'open') return { label: 'Open', key: 'open', statusKey: 'open' }
    if (status === 'assigned') return { label: 'Assigned', key: 'assigned', statusKey: 'assigned' }
    if (status === 'accepted') return { label: 'In Progress', key: 'in-progress', statusKey: 'in_progress' }
    if (status === 'in_progress') return { label: 'In Progress', key: 'in-progress', statusKey: 'in_progress' }
    if (status === 'resolved') return { label: 'Resolved', key: 'resolved', statusKey: 'resolved' }
    if (status === 'overdue') return { label: 'Overdue', key: 'overdue', statusKey: 'overdue' }
    if (status === 'closed') return { label: 'Closed', key: 'closed', statusKey: 'closed' }
    if (status === 'denied') return { label: 'Denied', key: 'denied', statusKey: 'denied' }
    if (status === 'escalated') return { label: 'Escalated', key: 'escalated', statusKey: 'escalated' }
    return { label: status, key: status, statusKey: status }
  }

  const filteredTickets = tickets
    .map((t) => {
      const statusObj = getStatusDisplay(t.status)
      return {
        id: t.code || t.id,
        title: t.title || '-',
        category:
          t.ticketCategories?.map((tc) => tc.category?.name).join(', ') || '-',
        room: t.room?.name || '-',
        status: statusObj.label,
        statusKey: statusObj.key,
        statusKeyForColor: statusObj.statusKey, // Original status for getStatusColor
        slaDue: t.dueDate
          ? formatDate(t.dueDate)
          : '-',
      }
    })
    .filter((ticket) => {
      if (filter === 'All') return true
      if (filter === 'Open') return ticket.statusKey === 'open'
      if (filter === 'Assigned') return ticket.statusKey === 'assigned'
      if (filter === 'In Progress') return ticket.statusKey === 'in-progress'
      if (filter === 'Resolved') return ticket.statusKey === 'resolved'
      if (filter === 'Overdue') return ticket.statusKey === 'overdue'
      return true
    })
    .slice(0, 5)

  return (
    <div className="page">
      <Snowfall color='#82C3D9' />
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Dashboard</h2>
          <p className="page-subtitle">
            Hello {displayName} - {displayRole}
          </p>
        </div>
        <ActionButton variant="success" onClick={() => navigate('/student/create-ticket')}>
          Create New Ticket
        </ActionButton>
      </div>

      <section className="section">
        <div className="cards-grid">
          {overviewStats.map((item) => (
            <div key={item.label} className="card kpi-card">
              <p className="kpi-label">{item.label}</p>
              <p className="kpi-value">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h3 className="section-title">Recent Tickets</h3>
          <div className="filter-pills">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className={`pill${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="card table-card">
          {loading ? (
            <div className="table-placeholder">Loading tickets...</div>
          ) : error ? (
            <div className="table-error">{error}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>SLA Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.title}</td>
                      <td>{ticket.category}</td>
                      <td>{ticket.room}</td>
                      <td>
                        {(() => {
                          const colorConfig = getStatusColor(ticket.statusKeyForColor);
                          return (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                padding: "0.375rem 0.875rem",
                                borderRadius: "9999px",
                                backgroundColor: colorConfig.bg,
                                color: colorConfig.text,
                                border: `1px solid ${colorConfig.border}`,
                                display: "inline-block",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ticket.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td>{ticket.slaDue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <Snowfall color='#ffffff' />
    </div>
  )
}

export default StudentDashboard
