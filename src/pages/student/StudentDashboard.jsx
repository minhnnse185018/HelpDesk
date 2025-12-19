import { useOutletContext } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton } from '../../components/templates'
import Snowfall from 'react-snowfall'

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
    if (
      t.status === 'assigned' ||
      t.status === 'accepted' ||
      t.status === 'in_progress'
    )
      stats.inProgress++
    if (t.status === 'resolved') stats.resolved++
  })

  const overviewStats = [
    { label: 'Open Tickets', value: stats.open },
    { label: 'In Progress', value: stats.inProgress },
    { label: 'Resolved', value: stats.resolved },
  ]

  const filters = ['All', 'New', 'In Progress', 'Resolved', 'Overdue']

  const getStatusDisplay = (status) => {
    if (status === 'open') return { label: 'New', key: 'new' }
    if (
      status === 'assigned' ||
      status === 'accepted' ||
      status === 'in_progress'
    )
      return { label: 'In Progress', key: 'in-progress' }
    if (status === 'resolved') return { label: 'Resolved', key: 'resolved' }
    if (status === 'overdue') return { label: 'Overdue', key: 'overdue' }
    if (status === 'closed') return { label: 'Closed', key: 'closed' }
    if (status === 'denied') return { label: 'Denied', key: 'denied' }
    return { label: status, key: status }
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
        slaDue: t.dueDate
          ? new Date(t.dueDate).toLocaleString('en-GB')
          : '-',
      }
    })
    .filter((ticket) => {
      if (filter === 'All') return true
      if (filter === 'New') return ticket.statusKey === 'new'
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
                        <span
                          className={`status-badge status-${ticket.statusKey}`}
                        >
                          {ticket.status}
                        </span>
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
