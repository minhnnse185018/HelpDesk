import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPriorityBadge(priority) {
  const configs = {
    low: { bg: '#ecfdf3', text: '#166534', label: 'Low' },
    medium: { bg: '#fef3c7', text: '#92400e', label: 'Medium' },
    high: { bg: '#fee2e2', text: '#b91c1c', label: 'High' },
    critical: { bg: '#7f1d1d', text: '#fef2f2', label: 'Critical' },
  }
  const config = configs[priority] || { bg: '#f3f4f6', text: '#4b5563', label: priority }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  )
}

function getStatusBadge(status) {
  const configs = {
    assigned: { bg: '#fef3c7', text: '#92400e', label: 'Assigned' },
    in_progress: { bg: '#e0f2fe', text: '#075985', label: 'In Progress' },
    resolved: { bg: '#dcfce7', text: '#166534', label: 'Resolved' },
    denied: { bg: '#fee2e2', text: '#991b1b', label: 'Denied' },
  }
  const config = configs[status] || { bg: '#e5e7eb', text: '#374151', label: status }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  )
}

function StaffDashboard() {
  const navigate = useNavigate()
  const [workload, setWorkload] = useState(null)
  const [subTickets, setSubTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Get current staff ID from token (simplified)
  const getCurrentStaffId = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || payload.userId || payload.id
    } catch {
      return null
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const staffId = getCurrentStaffId()
        if (!staffId) {
          throw new Error('Unable to get staff ID from token')
        }

        // Load workload and sub-tickets in parallel
        const [workloadRes, subTicketsRes] = await Promise.all([
          apiClient.get(`/api/v1/tickets/staff/${staffId}/workload`),
          apiClient.get('/api/v1/sub-tickets/assigned-to-me'),
        ])

        const workloadData = workloadRes?.data || workloadRes
        setWorkload(workloadData)

        const subTicketsData = subTicketsRes?.data || subTicketsRes
        const activeSubTickets = Array.isArray(subTicketsData)
          ? subTicketsData
              .filter((st) => st.status === 'assigned' || st.status === 'in_progress')
              .slice(0, 5)
          : []
        setSubTickets(activeSubTickets)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
        setError(err?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
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
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title">Staff Dashboard</h2>
          <p className="page-subtitle">Overview of your workload and tasks</p>
        </div>
      </div>

      {/* Workload Cards */}
      {workload && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <WorkloadCard
            title="Active Tickets"
            value={workload.totalActive || 0}
            color="#3b82f6"
            icon="📋"
          />
          <WorkloadCard
            title="Critical"
            value={workload.criticalCount || 0}
            color="#dc2626"
            icon="🔴"
          />
          <WorkloadCard
            title="High Priority"
            value={workload.highCount || 0}
            color="#ea580c"
            icon="🟠"
          />
          <WorkloadCard
            title="Overdue"
            value={workload.overdueCount || 0}
            color="#7c2d12"
            icon="⏰"
          />
        </div>
      )}

      {/* Active Sub-Tickets */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Active Sub-Tickets
          </h3>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/staff/sub-tickets')}
          >
            View All
          </button>
        </div>

        {subTickets.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            No active sub-tickets at the moment.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Parent Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subTickets.map((st) => (
                  <tr key={st.id}>
                    <td>{st.parentTicket?.title || 'N/A'}</td>
                    <td>{st.category?.name || 'N/A'}</td>
                    <td>{getPriorityBadge(st.priority)}</td>
                    <td>{getStatusBadge(st.status)}</td>
                    <td>{formatDate(st.dueDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/staff/sub-tickets/${st.id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        <button
          type="button"
          className="card"
          onClick={() => navigate('/staff/tickets')}
          style={{
            padding: '1.5rem',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎫</div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            My Assigned Tickets
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            View and manage parent tickets assigned to you
          </p>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => navigate('/staff/sub-tickets')}
          style={{
            padding: '1.5rem',
            textAlign: 'left',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📝</div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            My Sub-Tickets
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            View all sub-tickets assigned to you
          </p>
        </button>
      </div>
    </div>
  )
}

function WorkloadCard({ title, value, color, icon }) {
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {title}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
            {value}
          </p>
        </div>
        <div style={{ fontSize: '2rem', opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  )
}

export default StaffDashboard
