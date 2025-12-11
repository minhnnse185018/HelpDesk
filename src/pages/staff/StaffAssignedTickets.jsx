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
  if (!priority) return '-'
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
    cancelled: { bg: '#f3f4f6', text: '#4b5563', label: 'Cancelled' },
    closed: { bg: '#e5e7eb', text: '#374151', label: 'Closed' },
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

function StaffAssignedTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [denyModal, setDenyModal] = useState(null)
  const [resolveModal, setResolveModal] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // all, assigned, in_progress, resolved, cancelled, closed

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/api/v1/tickets/assigned-to-me')
      let data = response?.data?.data || response?.data || response

      // Convert object with numeric keys to array
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data)
        if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
          data = Object.values(data)
        } else {
          data = data.tickets || data.items || []
        }
      }

      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load tickets:', err)
      setError(err?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  // Filter tickets by status
  // Tickets with deniedReason are automatically considered cancelled
  const filteredTickets = activeTab === 'all' 
    ? tickets 
    : activeTab === 'cancelled'
      ? tickets.filter(ticket => ticket.status === 'cancelled' || ticket.deniedReason)
      : tickets.filter(ticket => ticket.status === activeTab && !ticket.deniedReason)

  // Count tickets by status
  // Tickets with deniedReason count as cancelled
  const statusCounts = {
    all: tickets.length,
    assigned: tickets.filter(t => t.status === 'assigned' && !t.deniedReason).length,
    in_progress: tickets.filter(t => t.status === 'in_progress' && !t.deniedReason).length,
    resolved: tickets.filter(t => t.status === 'resolved' && !t.deniedReason).length,
    cancelled: tickets.filter(t => t.status === 'cancelled' || t.deniedReason).length,
    closed: tickets.filter(t => t.status === 'closed' && !t.deniedReason).length,
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleAccept = async (ticketId) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/accept`)
      await loadTickets()
    } catch (err) {
      console.error('Failed to accept ticket:', err)
      alert('Failed to accept ticket: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleDeny = async (ticketId, reason) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/deny`, { reason })
      setDenyModal(null)
      // Load lại danh sách tickets
      await loadTickets()
    } catch (err) {
      console.error('Failed to deny ticket:', err)
      alert('Failed to deny ticket: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleResolve = async (ticketId, resolutionNote) => {
    try {
      await apiClient.patch(`/api/v1/tickets/${ticketId}/resolve`, { resolutionNote })
      setResolveModal(null)
      // Load lại danh sách tickets
      await loadTickets()
    } catch (err) {
      console.error('Failed to resolve ticket:', err)
      alert('Failed to resolve ticket: ' + (err?.message || 'Unknown error'))
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">My Assigned Tickets</h2>
          <p className="page-subtitle">Parent tickets assigned to you</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={loadTickets}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading tickets...
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

      {!loading && !error && tickets.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>No tickets assigned to you yet.</p>
        </div>
      )}

      {/* Status Tabs */}
      {!loading && !error && tickets.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '0.5rem'
          }}>
            <TabButton
              label={`All (${statusCounts.all})`}
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            />
            <TabButton
              label={`Assigned (${statusCounts.assigned})`}
              active={activeTab === 'assigned'}
              onClick={() => setActiveTab('assigned')}
              color="#92400e"
              bgColor="#fef3c7"
            />
            <TabButton
              label={`In Progress (${statusCounts.in_progress})`}
              active={activeTab === 'in_progress'}
              onClick={() => setActiveTab('in_progress')}
              color="#075985"
              bgColor="#e0f2fe"
            />
            <TabButton
              label={`Resolved (${statusCounts.resolved})`}
              active={activeTab === 'resolved'}
              onClick={() => setActiveTab('resolved')}
              color="#166534"
              bgColor="#dcfce7"
            />
            <TabButton
              label={`Cancelled (${statusCounts.cancelled})`}
              active={activeTab === 'cancelled'}
              onClick={() => setActiveTab('cancelled')}
              color="#4b5563"
              bgColor="#f3f4f6"
            />
            <TabButton
              label={`Closed (${statusCounts.closed})`}
              active={activeTab === 'closed'}
              onClick={() => setActiveTab('closed')}
              color="#374151"
              bgColor="#e5e7eb"
            />
          </div>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && filteredTickets.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>No tickets found for this status.</p>
        </div>
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Room</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.title}</td>
                    <td>{ticket.room?.name || 'N/A'}</td>
                    <td>{ticket.department?.name || 'N/A'}</td>
                    <td>{getPriorityBadge(ticket.priority)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>{formatDate(ticket.dueDate)}</td>
                    <td
                      style={{
                        whiteSpace: 'nowrap',
                        minWidth: '230px', // tùy bạn tăng/giảm
                      }}
                    >
                      {/* đảm bảo tất cả button nằm trên một dòng */}
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '0.5rem',
                          flexWrap: 'nowrap',
                          alignItems: 'center',
                        }}
                      >
                        {ticket.status === 'assigned' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)'
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)'
                              }}
                              onClick={() => handleAccept(ticket.id)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                color: '#dc2626',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)'
                              }}
                              onClick={() =>
                                setDenyModal({ id: ticket.id, title: ticket.title })
                              }
                            >
                              Deny
                            </button>
                          </>
                        )}

                        {ticket.status === 'in_progress' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              color: '#059669',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              borderRadius: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              backdropFilter: 'blur(40px) saturate(200%)',
                              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)'
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)'
                            }}
                            onClick={() =>
                              setResolveModal({ id: ticket.id, title: ticket.title })
                            }
                          >
                            Resolve
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            color: '#2563eb',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(40px) saturate(200%)',
                            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)'
                          }}
                          onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {denyModal && (
        <DenyTicketModal
          ticketTitle={denyModal.title}
          onClose={() => setDenyModal(null)}
          onSubmit={(reason) => handleDeny(denyModal.id, reason)}
        />
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <ResolveTicketModal
          ticketTitle={resolveModal.title}
          onClose={() => setResolveModal(null)}
          onSubmit={(resolutionNote) => handleResolve(resolveModal.id, resolutionNote)}
        />
      )}
    </div>
  )
}

// Deny Ticket Modal
function DenyTicketModal({ ticketTitle, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      alert('Please provide a reason for denying this ticket.')
      return
    }
    setSubmitting(true)
    await onSubmit(reason)
    setSubmitting(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '1.5rem',
          margin: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Deny Ticket
        </h3>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Ticket:</strong> {ticketTitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="reason"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
            >
              Reason for denial <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="reason"
              rows={4}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you are denying this ticket..."
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? 'Denying...' : 'Deny Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Resolve Ticket Modal
function ResolveTicketModal({ ticketTitle, onClose, onSubmit }) {
  const [resolutionNote, setResolutionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!resolutionNote.trim()) {
      alert('Please provide resolution notes.')
      return
    }
    setSubmitting(true)
    await onSubmit(resolutionNote)
    setSubmitting(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '1.5rem',
          margin: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Resolve Ticket
        </h3>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Ticket:</strong> {ticketTitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="resolutionNote"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
            >
              Resolution Notes <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="resolutionNote"
              rows={4}
              className="input"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe how you resolved this ticket..."
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Resolving...' : 'Resolve Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({ label, active, onClick, color = '#2563eb', bgColor = '#dbeafe' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: active ? bgColor : 'transparent',
        color: active ? color : '#6b7280',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f3f4f6'
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {label}
    </button>
  )
}

export default StaffAssignedTickets
