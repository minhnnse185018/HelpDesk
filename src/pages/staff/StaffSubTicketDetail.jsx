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
    assigned: { bg: '#fef3c7', text: '#92400e', label: 'Assigned' },
    in_progress: { bg: '#e0f2fe', text: '#075985', label: 'In Progress' },
    resolved: { bg: '#dcfce7', text: '#166534', label: 'Resolved' },
    denied: { bg: '#fee2e2', text: '#991b1b', label: 'Denied' },
    escalated: { bg: '#fef08a', text: '#854d0e', label: 'Escalated' },
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

function StaffSubTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subTicket, setSubTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [denyModal, setDenyModal] = useState(false)
  const [resolveModal, setResolveModal] = useState(false)
  const [reassignModal, setReassignModal] = useState(false)
  const [alertModal, setAlertModal] = useState(null)

  const loadSubTicket = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get(`/api/v1/sub-tickets/${id}`)
      const data = response?.data || response
      setSubTicket(data)
    } catch (err) {
      console.error('Failed to load sub-ticket:', err)
      setError(err?.message || 'Failed to load sub-ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubTicket()
  }, [id])

  const handleAccept = async () => {
    try {
      await apiClient.post(`/api/v1/sub-tickets/${id}/accept`)
      await loadSubTicket()
    } catch (err) {
      console.error('Failed to accept sub-ticket:', err)
      setAlertModal({ message: 'Failed to accept sub-ticket: ' + (err?.message || 'Unknown error') })
    }
  }

  const handleDeny = async (reason) => {
    try {
      await apiClient.post(`/api/v1/sub-tickets/${id}/deny`, { reason })
      setDenyModal(false)
      await loadSubTicket()
    } catch (err) {
      console.error('Failed to deny sub-ticket:', err)
      setAlertModal({ message: 'Failed to deny sub-ticket: ' + (err?.message || 'Unknown error') })
    }
  }

  const handleResolve = async (resolutionNote) => {
    try {
      await apiClient.patch(`/api/v1/sub-tickets/${id}/resolve`, { resolutionNote })
      setResolveModal(false)
      await loadSubTicket()
    } catch (err) {
      console.error('Failed to resolve sub-ticket:', err)
      setAlertModal({ message: 'Failed to resolve sub-ticket: ' + (err?.message || 'Unknown error') })
    }
  }

  const handleReassignRequest = async (reason) => {
    try {
      await apiClient.post('/api/v1/reassign-requests', {
        subTicketId: id,
        reason,
      })
      setReassignModal(false)
      setAlertModal({ message: 'Reassign request submitted successfully' })
    } catch (err) {
      console.error('Failed to submit reassign request:', err)
      setAlertModal({ message: 'Failed to submit reassign request: ' + (err?.message || 'Unknown error') })
    }
  }

  const canReassign = (status) => {
    return ['assigned', 'in_progress', 'escalated'].includes(status)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading sub-ticket details...
        </div>
      </div>
    )
  }

  if (error || !subTicket) {
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
          {error || 'Sub-ticket not found'}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginTop: '1rem' }}
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Sub-Ticket Detail</h2>
          <p className="page-subtitle">#{subTicket.id.slice(0, 8)}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>

      {/* Header Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {subTicket.parentTicket?.title || 'Parent Ticket'}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
              }}
            >
              {subTicket.category?.name}
            </span>
            {getStatusBadge(subTicket.status)}
            {getPriorityBadge(subTicket.priority)}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {subTicket.status === 'assigned' && (
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
                Accept Sub-Ticket
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
                Deny Sub-Ticket
              </button>
            </>
          )}

          {subTicket.status === 'in_progress' && (
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
              Resolve Sub-Ticket
            </button>
          )}

          {canReassign(subTicket.status) && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => setReassignModal(true)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '14px',
                backdropFilter: 'blur(40px) saturate(200%)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              }}
            >
              Request Reassignment
            </button>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Information</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem 1.5rem',
          }}
        >
          <InfoItem label="Assignee">
            {subTicket.assignee?.fullName || 'N/A'}
          </InfoItem>
          <InfoItem label="Room">
            {subTicket.parentTicket?.room?.name || 'N/A'}
            {typeof subTicket.parentTicket?.room?.floor === 'number'
              ? ` - Floor ${subTicket.parentTicket.room.floor}`
              : ''}
          </InfoItem>
          <InfoItem label="Creator">
            {subTicket.parentTicket?.creator?.fullName || 'N/A'}
          </InfoItem>
          <InfoItem label="Assigned At">
            {formatDate(subTicket.assignedAt)}
          </InfoItem>
          <InfoItem label="Accepted At">
            {formatDate(subTicket.acceptedAt)}
          </InfoItem>
          <InfoItem label="Due Date">
            {formatDate(subTicket.dueDate)}
          </InfoItem>
          {subTicket.resolvedAt && (
            <InfoItem label="Resolved At">
              {formatDate(subTicket.resolvedAt)}
            </InfoItem>
          )}
          {subTicket.deniedAt && (
            <InfoItem label="Denied At">
              {formatDate(subTicket.deniedAt)}
            </InfoItem>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
          Parent Ticket Description
        </h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>
          {subTicket.parentTicket?.description || 'No description'}
        </p>
      </div>

      {/* Result Section */}
      {(subTicket.deniedReason || subTicket.resolutionNote) && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
            Resolution / Result
          </h4>
          {subTicket.deniedReason && (
            <>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                  color: '#dc2626',
                }}
              >
                Denied Reason:
              </p>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '0.75rem', color: '#374151' }}>
                {subTicket.deniedReason}
              </p>
            </>
          )}
          {subTicket.resolutionNote && (
            <>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                  color: '#166534',
                }}
              >
                Resolution Note:
              </p>
              <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>
                {subTicket.resolutionNote}
              </p>
            </>
          )}
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <AlertModal
          message={alertModal.message}
          onClose={() => setAlertModal(null)}
        />
      )}

      {/* Modals */}
      {denyModal && (
        <DenyModal
          onClose={() => setDenyModal(false)}
          onSubmit={handleDeny}
        />
      )}

      {resolveModal && (
        <ResolveModal
          onClose={() => setResolveModal(false)}
          onSubmit={handleResolve}
        />
      )}

      {reassignModal && (
        <ReassignModal
          onClose={() => setReassignModal(false)}
          onSubmit={handleReassignRequest}
          subTicket={subTicket}
        />
      )}
    </div>
  )
}

function InfoItem({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.15rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.9rem', color: '#111827' }}>{children}</p>
    </div>
  )
}

// Deny Modal
function DenyModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Deny Sub-Ticket
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="reason"
              rows={4}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are denying..."
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
              {submitting ? 'Denying...' : 'Deny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Resolve Modal
function ResolveModal({ onClose, onSubmit }) {
  const [resolutionNote, setResolutionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!resolutionNote.trim()) {
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Resolve Sub-Ticket
        </h3>

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
              placeholder="Describe how you resolved this..."
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
              {submitting ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reassign Modal
function ReassignModal({ onClose, onSubmit, subTicket }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Request Reassignment
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="reason"
              rows={4}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need reassignment..."
              required
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem',
              }}
            >
              Admin will review and assign a suitable staff member
            </p>
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
            <button type="submit" className="btn btn-warning" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Alert Modal Component
function AlertModal({ message, onClose }) {
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
          maxWidth: '400px',
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
        <div style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600, textAlign: 'center' }}>
          Notice
        </div>
        <div style={{ marginBottom: '1.5rem', color: '#374151', textAlign: 'center' }}>
          {message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ minWidth: '100px' }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffSubTicketDetail
