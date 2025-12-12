import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
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
    open: { bg: '#dbeafe', text: '#1e40af', label: 'Open' },
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
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  )
}

function StaffTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [denyModal, setDenyModal] = useState(false)
  const [resolveModal, setResolveModal] = useState(false)

  const loadTicket = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get(`/api/v1/tickets/${id}`)
      const data = response?.data || response
      setTicket(data)
    } catch (err) {
      console.error('Failed to load ticket:', err)
      setError(err?.message || 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTicket()
  }, [id])

  const handleAccept = async () => {
    try {
      await apiClient.post(`/api/v1/tickets/${id}/accept`)
      await loadTicket()
    } catch (err) {
      console.error('Failed to accept ticket:', err)
      alert('Failed to accept ticket: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleDeny = async (reason) => {
    try {
      await apiClient.post(`/api/v1/tickets/${id}/deny`, { reason })
      setDenyModal(false)
      await loadTicket()
    } catch (err) {
      console.error('Failed to deny ticket:', err)
      alert('Failed to deny ticket: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleResolve = async (resolutionNote) => {
    try {
      await apiClient.patch(`/api/v1/tickets/${id}/resolve`, { resolutionNote })
      setResolveModal(false)
      await loadTicket()
    } catch (err) {
      console.error('Failed to resolve ticket:', err)
      alert('Failed to resolve ticket: ' + (err?.message || 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 600 }}>Loading</div>
          <div style={{ color: '#6b7280' }}>Loading ticket details...</div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #dc2626', backgroundColor: '#fef2f2' }}>
          <div style={{ color: '#991b1b', fontWeight: 600 }}>❌ Error</div>
          <div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{error || 'Ticket not found'}</div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/staff/tickets')}
            style={{ marginTop: '1rem' }}
          >
            Back to Tickets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Ticket Details</h2>
          <p className="page-subtitle">View and manage parent ticket</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/staff/tickets')}
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Ticket Info Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>{ticket.title}</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>Status: {getStatusBadge(ticket.status)}</div>
              <div>Priority: {getPriorityBadge(ticket.priority)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ticket.status === 'assigned' && (
              <>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleAccept}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '14px',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setDenyModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: '#dc2626',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '14px',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  }}
                >
                  Deny
                </button>
              </>
            )}
            {ticket.status === 'in_progress' && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => setResolveModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '14px',
                  backdropFilter: 'blur(40px) saturate(200%)',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                }}
              >
                Resolve
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <InfoItem label="Room" value={ticket.room?.name || 'N/A'} />
          <InfoItem label="Department" value={ticket.department?.name || 'N/A'} />
          <InfoItem label="Assigned To" value={ticket.assignee?.fullName || ticket.assignee?.username || 'N/A'} />
          <InfoItem label="Created By" value={ticket.createdBy?.fullName || ticket.createdBy?.username || 'N/A'} />
          <InfoItem label="Created At" value={formatDate(ticket.createdAt)} />
          <InfoItem label="Due Date" value={formatDate(ticket.dueDate)} />
        </div>

        {ticket.description && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Description</div>
            <div style={{ color: '#6b7280', whiteSpace: 'pre-wrap' }}>{ticket.description}</div>
          </div>
        )}

        {ticket.deniedReason && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ffffffff', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#000000ff' }}> Denied Reason</div>
            <div style={{ color: '#000000ff', whiteSpace: 'pre-wrap' }}>{ticket.deniedReason}</div>
          </div>
        )}

        {ticket.resolutionNote && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ffffffff', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#000000ff' }}> Resolution Note</div>
            <div style={{ color: '#000000ff', whiteSpace: 'pre-wrap' }}>{ticket.resolutionNote}</div>
          </div>
        )}

        {ticket.ticketCategories && ticket.ticketCategories.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Categories</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ticket.ticketCategories.map((tc, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#e0f2fe',
                    color: '#0c4a6e',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                  }}
                >
                  {tc.category?.name || 'Unknown'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Deny Modal */}
      {denyModal && (
        <DenyTicketModal
          ticketTitle={ticket.title}
          onClose={() => setDenyModal(false)}
          onSubmit={handleDeny}
        />
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <ResolveTicketModal
          ticketTitle={ticket.title}
          onClose={() => setResolveModal(false)}
          onSubmit={handleResolve}
        />
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontWeight: 500, color: '#111827' }}>{value}</div>
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
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Deny Ticket</h3>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Ticket:</strong> {ticketTitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
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
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Resolve Ticket</h3>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Ticket:</strong> {ticketTitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="resolutionNote" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
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

export default StaffTicketDetail
