import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton, AlertModal } from '../../components/templates'

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
  const [subTickets, setSubTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [denyModal, setDenyModal] = useState(false)
  const [resolveModal, setResolveModal] = useState(false)
  const [reassignModal, setReassignModal] = useState(false)
  const [imageModal, setImageModal] = useState(null)
  const [alertModal, setAlertModal] = useState(null)
  const [creatorDetails, setCreatorDetails] = useState(null)

  const loadTicket = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get(`/api/v1/tickets/${id}`)
      const data = response?.data || response

      // Fetch category details for each ticketCategory if needed
      if (data.ticketCategories && Array.isArray(data.ticketCategories) && data.ticketCategories.length > 0) {
        try {
          const categoryPromises = data.ticketCategories.map(async (tc) => {
            // If categoryId exists but category object is missing or incomplete
            if (tc.categoryId && (!tc.category || !tc.category.name)) {
              try {
                const catRes = await apiClient.get(`/api/v1/categories/${tc.categoryId}`)
                const categoryData = catRes?.data || catRes
                return { ...tc, category: categoryData }
              } catch (err) {
                console.error(`Failed to fetch category ${tc.categoryId}:`, err)
                return tc
              }
            }
            return tc
          })
          
          data.ticketCategories = await Promise.all(categoryPromises)
        } catch (err) {
          console.error('Failed to fetch categories:', err)
        }
      }

      setTicket(data)

      // Fetch creator details if needed
      const creatorId = typeof data.createdBy === 'string' ? data.createdBy : (data.createdBy?.id || data.creator?.id)
      const existingCreator = data.creator || (typeof data.createdBy === 'object' ? data.createdBy : null)
      
      if (creatorId) {
        // If creator object exists but fullName is missing/null, fetch from API
        if (existingCreator && (!existingCreator.fullName || existingCreator.fullName === null)) {
          try {
            const creatorRes = await apiClient.get(`/api/v1/users/${creatorId}`)
            const creatorData = creatorRes?.data || creatorRes
            setCreatorDetails(creatorData)
          } catch (err) {
            console.error('Failed to load creator details:', err)
            // Use existing creator data if fetch fails
            setCreatorDetails(existingCreator)
          }
        } else if (existingCreator) {
          setCreatorDetails(existingCreator)
        } else {
          // If only ID is available, fetch from API
          try {
            const creatorRes = await apiClient.get(`/api/v1/users/${creatorId}`)
            const creatorData = creatorRes?.data || creatorRes
            setCreatorDetails(creatorData)
          } catch (err) {
            console.error('Failed to load creator details:', err)
            setCreatorDetails({ id: creatorId })
          }
        }
      }
    } catch (err) {
      console.error('Failed to load ticket:', err)
      setError(err?.message || 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const loadSubTickets = async () => {
    if (!id) return
    try {
      const response = await apiClient.get(`/api/v1/tickets/${id}/sub-tickets`)
      const data = response?.data || response
      setSubTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load sub-tickets:', err)
      setSubTickets([])
    }
  }

  useEffect(() => {
    loadTicket()
    loadSubTickets()
  }, [id])

  const handleAccept = async () => {
    try {
      await apiClient.post(`/api/v1/tickets/${id}/accept`)
      await loadTicket()
    } catch (err) {
      console.error('Failed to accept ticket:', err)
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to accept ticket: ' + (err?.message || 'Unknown error') 
      })
    }
  }

  const handleDeny = async (reason) => {
    try {
      await apiClient.post(`/api/v1/tickets/${id}/deny`, { reason })
      setDenyModal(false)
      await loadTicket()
    } catch (err) {
      console.error('Failed to deny ticket:', err)
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to deny ticket: ' + (err?.message || 'Unknown error') 
      })
    }
  }

  const handleResolve = async (resolutionNote) => {
    try {
      await apiClient.patch(`/api/v1/tickets/${id}/resolve`, { resolutionNote })
      setResolveModal(false)
      await loadTicket()
    } catch (err) {
      console.error('Failed to resolve ticket:', err)
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to resolve ticket: ' + (err?.message || 'Unknown error') 
      })
    }
  }

  const handleReassignRequest = async (reason) => {
    try {
      const payload = {
        ticketId: id,
        reason,
      }
      // Add departmentId if available
      if (ticket?.departmentId || ticket?.department?.id) {
        payload.departmentId = ticket.departmentId || ticket.department.id
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
    return ['assigned', 'accepted', 'in_progress'].includes(status)
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
          <ActionButton
            variant="secondary"
            onClick={() => navigate('/staff/tickets')}
            style={{ marginTop: '1rem' }}
          >
            Back to Tickets
          </ActionButton>
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
                <ActionButton
                  variant="success"
                  onClick={handleAccept}
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
            {(ticket.status === 'accepted' || ticket.status === 'in_progress') && (
              <ActionButton
                variant="success"
                onClick={() => setResolveModal(true)}
              >
                Resolve
              </ActionButton>
            )}
            {canReassign(ticket.status) && (
              <ActionButton
                variant="info"
                onClick={() => setReassignModal(true)}
              >
                Reassign
              </ActionButton>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <InfoItem label="Room" value={ticket.room?.name || 'N/A'} />
          <InfoItem label="Department" value={ticket.department?.name || 'N/A'} />
          <InfoItem 
            label="Category" 
            value={
              ticket.ticketCategories && ticket.ticketCategories.length > 0 ? (
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
                        fontWeight: 500,
                      }}
                    >
                      {tc.category?.name || 'N/A'}
                    </span>
                  ))}
                </div>
              ) : (
                'N/A'
              )
            } 
          />
          <InfoItem label="Assigned To" value={ticket.assignee?.fullName || ticket.assignee?.username || 'N/A'} />
          <InfoItem 
            label="Created By" 
            value={
              (creatorDetails?.fullName || ticket.creator?.fullName || ticket.createdBy?.fullName) || 
              (creatorDetails?.username || ticket.creator?.username || ticket.createdBy?.username) || 
              'N/A'
            } 
          />
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

        

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>Attachments ({ticket.attachments.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {ticket.attachments.map((attachment) => {
                const isImage = attachment.mimeType?.startsWith('image/')
                return (
                  <div
                    key={attachment.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#fff',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onClick={() => {
                      if (isImage) {
                        setImageModal(attachment)
                      } else {
                        downloadFile(attachment.filePath, attachment.fileName)
                      }
                    }}
                  >
                    {isImage ? (
                      <img
                        src={attachment.filePath}
                        alt={attachment.fileName}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '150px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f3f4f6',
                        }}
                      >
                        <span style={{ fontSize: '3rem', color: '#9ca3af' }}>📄</span>
                      </div>
                    )}
                    <div style={{ padding: '0.75rem' }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '0.25rem',
                        }}
                        title={attachment.fileName}
                      >
                        {attachment.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {(parseInt(attachment.fileSize) / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tickets Section */}
      {subTickets.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            Sub-Tickets ({subTickets.length})
          </h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned At</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subTickets.map((subTicket) => (
                  <tr key={subTicket.id}>
                    <td>{subTicket.category?.name || 'N/A'}</td>
                    <td>{subTicket.assignee?.fullName || subTicket.assignee?.username || 'N/A'}</td>
                    <td>{getPriorityBadge(subTicket.priority)}</td>
                    <td>
                      {(() => {
                        const statusConfigs = {
                          assigned: { bg: '#fef3c7', text: '#92400e', label: 'Assigned' },
                          in_progress: { bg: '#e0f2fe', text: '#075985', label: 'In Progress' },
                          resolved: { bg: '#dcfce7', text: '#166534', label: 'Resolved' },
                          denied: { bg: '#fee2e2', text: '#991b1b', label: 'Denied' },
                          escalated: { bg: '#fef08a', text: '#854d0e', label: 'Escalated' },
                        }
                        const config = statusConfigs[subTicket.status] || { bg: '#e5e7eb', text: '#374151', label: subTicket.status }
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
                      })()}
                    </td>
                    <td>{formatDate(subTicket.assignedAt)}</td>
                    <td>{formatDate(subTicket.dueDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/staff/sub-tickets/${subTicket.id}`)}
                        style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={() => setImageModal(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModal(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'
              }}
            >
              ×
            </button>
            <img
              src={imageModal.filePath}
              alt={imageModal.fileName}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                display: 'block',
              }}
            />
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{imageModal.fileName}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {(parseInt(imageModal.fileSize) / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
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

      {/* Reassign Modal */}
      {reassignModal && (
        <ReassignModal
          ticketTitle={ticket?.title || 'N/A'}
          onClose={() => setReassignModal(false)}
          onSubmit={handleReassignRequest}
        />
      )}

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
            <ActionButton type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </ActionButton>
            <ActionButton type="submit" variant="danger" disabled={submitting}>
              {submitting ? 'Denying...' : 'Deny Ticket'}
            </ActionButton>
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
            <ActionButton type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </ActionButton>
            <ActionButton type="submit" variant="success" disabled={submitting}>
              {submitting ? 'Resolving...' : 'Resolve Ticket'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reassign Ticket Modal
function ReassignModal({ ticketTitle, onClose, onSubmit }) {
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
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Request Reassignment
        </h3>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Ticket:</strong> {ticketTitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="reassignReason"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
            >
              Reason for reassignment <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="reassignReason"
              rows={4}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to reassign this ticket..."
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
            <ActionButton
              type="submit"
              variant="info"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StaffTicketDetail
