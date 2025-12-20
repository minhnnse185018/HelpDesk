import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton, AlertModal } from '../../components/templates'
import { formatDate, getStatusBadge } from '../../utils/ticketHelpers.jsx'

function formatDurationMinutes(minutes) {
  const total = Number(minutes)
  if (!Number.isFinite(total)) return 'N/A'
  if (total < 60) return `${total} minutes`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
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
      
      // Fetch category details if categoryId exists but category object is incomplete
      if (data.categoryId && !data.category?.name) {
        try {
          const catRes = await apiClient.get(`/api/v1/categories/${data.categoryId}`)
          data.category = catRes.data || catRes
        } catch (err) {
          console.error('Failed to fetch category:', err)
        }
      }
      
      // Fetch room details if roomId exists in parent ticket
      if (data.parentTicket?.roomId && !data.parentTicket?.room?.name) {
        try {
          const roomRes = await apiClient.get(`/api/v1/rooms/${data.parentTicket.roomId}`)
          data.parentTicket.room = roomRes.data || roomRes
        } catch (err) {
          console.error('Failed to fetch room:', err)
        }
      }
      
      // Fetch department details from category's departmentId
      if (data.category?.departmentId && !data.department) {
        try {
          const deptRes = await apiClient.get(`/api/v1/departments/${data.category.departmentId}`)
          data.department = deptRes.data || deptRes
        } catch (err) {
          console.error('Failed to fetch department:', err)
        }
      }
      
      // Fetch creator details if parentTicket.createdBy exists
      let creatorId = null;
      if (data.parentTicket?.createdBy) {
        creatorId = data.parentTicket.createdBy;
      } else if (data.createdBy) {
        creatorId = data.createdBy;
      }
      if (creatorId) {
        try {
          const creatorRes = await apiClient.get(`/api/v1/users/${creatorId}`)
          data.creator = creatorRes.data || creatorRes
        } catch (err) {
          console.error('Failed to fetch creator:', err)
        }
      }
      
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
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to deny sub-ticket: ' + (err?.message || 'Unknown error') 
      })
    }
  }

  const handleResolve = async (resolutionNote) => {
    try {
      await apiClient.patch(`/api/v1/sub-tickets/${id}/resolve`, { resolutionNote })
      setResolveModal(false)
      await loadSubTicket()
    } catch (err) {
      console.error('Failed to resolve sub-ticket:', err)
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to resolve sub-ticket: ' + (err?.message || 'Unknown error') 
      })
    }
  }

  const handleReassignRequest = async (reason) => {
    try {
      const payload = {
        subTicketId: id,
        reason,
      }
      // Add departmentId if available from subTicket
      if (subTicket?.parentTicket?.departmentId || subTicket?.parentTicket?.department?.id) {
        payload.departmentId = subTicket.parentTicket.departmentId || subTicket.parentTicket.department.id
      }
      
      await apiClient.post('/api/v1/reassign-requests', payload)
      setReassignModal(false)
      setAlertModal({ 
        type: 'success',
        title: 'Success',
        message: 'Reassign request submitted successfully' 
      })
    } catch (err) {
      console.error('Failed to submit reassign request:', err)
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to submit reassign request: ' + (err?.message || 'Unknown error') 
      })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Left: Title and badges */}
          <div style={{ flex: 1 }}>
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
                {subTicket.category?.name || 'N/A'}
              </span>
              {getStatusBadge(subTicket.status)}
              {getPriorityBadge(subTicket.priority)}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {subTicket.status === 'assigned' && (
              <>
                <ActionButton
                  variant="success"
                  onClick={handleAccept}
                  style={{ marginTop: "50px" }}
                >
                  Accept
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={() => setDenyModal(true)}
                >
                  Deny
                </ActionButton>
              </>
            )}

            {subTicket.status === 'in_progress' && (
              <ActionButton
                variant="success"
                onClick={() => setResolveModal(true)}
                style={{ marginTop: "20px" }}
              >
                Resolve
              </ActionButton>
            )}

            {canReassign(subTicket.status) && (
              <ActionButton
                variant="warning"
                onClick={() => setReassignModal(true)}
                style={{ marginTop: "20px" }}
              >
                Reassign
              </ActionButton>
            )}
          </div>
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
            <div>
              <div style={{ fontWeight: 500 }}>
                {subTicket.assignee?.fullName || subTicket.assignee?.username || 'N/A'}
              </div>
            </div>
          </InfoItem>
          <InfoItem label="Room">
            {subTicket.parentTicket?.room?.name || 'N/A'}
            {subTicket.parentTicket?.room?.code ? ` (${subTicket.parentTicket.room.code})` : ''}
            {typeof subTicket.parentTicket?.room?.floor === 'number'
              ? ` - Floor ${subTicket.parentTicket.room.floor}`
              : ''}
          </InfoItem>
          <InfoItem label="Department">
            {subTicket.department?.name || subTicket.category?.department?.name || 'N/A'}
            {(subTicket.department?.code || subTicket.category?.department?.code) 
              ? ` (${subTicket.department?.code || subTicket.category?.department?.code})` 
              : ''}
          </InfoItem>
          <InfoItem label="Problems">
            <div>
          
              {subTicket.category?.code && (
                <div style={{ fontSize: '0.75rem', color: '#2b2c2eff' }}>
                  Code: {subTicket.category.code}
                </div>
              )}
              {subTicket.category?.description && (
                <div style={{ fontSize: '0.75rem', color: '#000000ff', marginTop: '0.25rem' }}>
                  {subTicket.category.description}
                </div>
              )}
            </div>
          </InfoItem>

          <InfoItem label="Creator">
            {subTicket.creator?.fullName || subTicket.creator?.username || subTicket.creator?.email || 'N/A'}
          </InfoItem>
          <InfoItem label="Created At">
            {formatDate(subTicket.createdAt)}
          </InfoItem>
          <InfoItem label="Assigned At">
            {formatDate(subTicket.assignedAt)}
          </InfoItem>
          <InfoItem label="Accepted At">
            {formatDate(subTicket.acceptedAt)}
          </InfoItem>
          <InfoItem label="Due Date">
            <span style={{ 
              color: subTicket.dueDate && new Date(subTicket.dueDate) < new Date() ? '#dc2626' : 'inherit',
              fontWeight: subTicket.dueDate && new Date(subTicket.dueDate) < new Date() ? 600 : 'inherit'
            }}>
              {formatDate(subTicket.dueDate)}
              {subTicket.dueDate && new Date(subTicket.dueDate) < new Date() && ' (Overdue)'}
            </span>
          </InfoItem>
          {subTicket.escalatedAt && (
            <InfoItem label="Escalated At">
              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                ⚠️ {formatDate(subTicket.escalatedAt)}
              </span>
            </InfoItem>
          )}
          {subTicket.resolvedAt && (
            <InfoItem label="Resolved At">
              <span style={{ color: '#059669', fontWeight: 500 }}>
                ✓ {formatDate(subTicket.resolvedAt)}
              </span>
            </InfoItem>
          )}
          {subTicket.deniedAt && (
            <InfoItem label="Denied At">
              <span style={{ color: '#dc2626', fontWeight: 500 }}>
                ✗ {formatDate(subTicket.deniedAt)}
              </span>
            </InfoItem>
          )}
        </div>
      </div>

      {/* SLA Policy Info */}
      {subTicket.slaPolicy && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>SLA Policy</h4>
          {subTicket.slaPolicy.description && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#4b5563',
              }}
            >
              <strong>Description:</strong> {subTicket.slaPolicy.description}
            </div>
          )}
        </div>
      )}

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
          isOpen={!!alertModal}
          message={alertModal.message}
          title={alertModal.title || 'Notice'}
          type={alertModal.type || 'info'}
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
      <div style={{ fontSize: '0.9rem', color: '#111827' }}>{children}</div>
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
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </ActionButton>
            <ActionButton type="submit" variant="danger" disabled={submitting}>
              {submitting ? 'Denying...' : 'Deny'}
            </ActionButton>
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
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </ActionButton>
            <ActionButton type="submit" variant="success" disabled={submitting}>
              {submitting ? 'Resolving...' : 'Resolve'}
            </ActionButton>
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
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </ActionButton>
            <ActionButton type="submit" variant="warning" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  )
}


export default StaffSubTicketDetail
