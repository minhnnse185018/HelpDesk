import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton, AlertModal } from '../../components/templates'
import { useNotificationSocket } from '../../context/NotificationSocketContext'

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
  const { socket } = useNotificationSocket()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [denyModal, setDenyModal] = useState(null)
  const [resolveModal, setResolveModal] = useState(null)
  const [reassignModal, setReassignModal] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [alertModal, setAlertModal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('') // all, assigned, in_progress, resolved, cancelled, closed

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

  // Filter tickets by status and search term
  // Tickets with deniedReason are automatically considered cancelled
  let filteredTickets = activeTab === 'all' 
    ? tickets 
    : activeTab === 'cancelled'
      ? tickets.filter(ticket => ticket.status === 'cancelled' || ticket.deniedReason)
      : tickets.filter(ticket => ticket.status === activeTab && !ticket.deniedReason)
  
  // Apply search filter
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()
    filteredTickets = filteredTickets.filter((ticket) =>
      ticket.title?.toLowerCase().includes(searchLower) ||
      ticket.room?.name?.toLowerCase().includes(searchLower) ||
      ticket.room?.code?.toLowerCase().includes(searchLower) ||
      ticket.department?.name?.toLowerCase().includes(searchLower) ||
      ticket.status?.toLowerCase().includes(searchLower) ||
      ticket.priority?.toLowerCase().includes(searchLower)
    )
  }

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

    // Listen for custom window event (from CreateTicket or AssignTicket)
    const handleTicketCreated = async (event) => {
      const newTicket = event.detail
      if (!newTicket || !newTicket.id) return

      try {
        // Fetch full ticket details to check assignee
        const ticketRes = await apiClient.get(`/api/v1/tickets/${newTicket.id}`)
        const fullTicket = ticketRes?.data || ticketRes

        // Check if ticket is assigned to current staff
        const currentUserId = getCurrentUserId()
        const isAssignedToMe = fullTicket.assignee?.id === currentUserId || 
                              fullTicket.assigneeId === currentUserId ||
                              fullTicket.assignee?.userId === currentUserId

        if (isAssignedToMe) {
          // Check if ticket already exists (avoid duplicates)
          setTickets((prevTickets) => {
            const exists = prevTickets.some(t => t.id === fullTicket.id)
            if (exists) return prevTickets
            // Add new ticket to the beginning of the list
            return [fullTicket, ...prevTickets]
          })
        }
      } catch (err) {
        console.error('Failed to fetch new ticket details:', err)
      }
    }

    // Listen for socket event from server (if server emits ticket:created or ticket:assigned)
    const handleSocketTicketCreated = async (ticketData) => {
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
          setTickets((prevTickets) => {
            const exists = prevTickets.some(t => t.id === fullTicket.id)
            if (exists) return prevTickets
            return [fullTicket, ...prevTickets]
          })
        }
      } catch (err) {
        console.error('Failed to fetch new ticket from socket:', err)
      }
    }

    // Listen for ticket assigned event (when admin assigns ticket to staff)
    const handleTicketAssigned = async (event) => {
      const ticketData = event.detail || event
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
          setTickets((prevTickets) => {
            const exists = prevTickets.some(t => t.id === fullTicket.id)
            if (exists) return prevTickets
            return [fullTicket, ...prevTickets]
          })
        }
      } catch (err) {
        console.error('Failed to fetch assigned ticket details:', err)
      }
    }

    // Register event listeners
    window.addEventListener('ticket:created', handleTicketCreated)
    window.addEventListener('ticket:assigned', handleTicketAssigned)
    
    if (socket) {
      socket.on('ticket:created', handleSocketTicketCreated)
      socket.on('ticket:assigned', handleTicketAssigned)
    }

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated)
      window.removeEventListener('ticket:assigned', handleTicketAssigned)
      if (socket) {
        socket.off('ticket:created', handleSocketTicketCreated)
        socket.off('ticket:assigned', handleTicketAssigned)
      }
    }
  }, [socket])

  const handleAccept = async (ticketId) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/accept`)
      await loadTickets()
    } catch (err) {
      console.error('Failed to accept ticket:', err)
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to accept ticket: ' + (err?.message || 'Unknown error') 
      })
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
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to deny ticket: ' + (err?.message || 'Unknown error') 
      })
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
      setAlertModal({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to resolve ticket: ' + (err?.message || 'Unknown error') 
      })
    }
  }

  const handleReassignRequest = async (ticketId, reason, departmentId, staffId) => {
    try {
      const payload = {
        ticketId,
        reason,
      }
      // Add departmentId if available
      if (departmentId) {
        payload.departmentId = departmentId
      }
      // Add staffId if available (suggested staff)
      if (staffId) {
        payload.staffId = staffId
      }
      
      await apiClient.post('/api/v1/reassign-requests', payload)
      setReassignModal(null)
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
    return ['assigned', 'in_progress'].includes(status)
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">My Assigned Tickets</h2>
          <p className="page-subtitle">Parent tickets assigned to you</p>
        </div>

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

      {/* Search Box */}
      {!loading && !error && tickets.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search tickets by title, room, department, status, priority..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor: "rgba(255, 255, 255, 0.72)",
              color: "#374151",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "14px",
              backdropFilter: "blur(40px) saturate(180%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
            }}
          />
          {searchTerm && (
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
              Found {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            </p>
          )}
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
                        minWidth: '300px', // Increased to accommodate Reassign button
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
                            <ActionButton
                              variant="success"
                              onClick={() => handleAccept(ticket.id)}
                            >
                              Accept
                            </ActionButton>
                            <ActionButton
                              variant="danger"
                              onClick={() =>
                                setDenyModal({ id: ticket.id, title: ticket.title })
                              }
                            >
                              Deny
                            </ActionButton>
                          </>
                        )}

                        {ticket.status === 'in_progress' && (
                          <ActionButton
                            variant="success"
                            onClick={() =>
                              setResolveModal({ id: ticket.id, title: ticket.title })
                            }
                          >
                            Resolve
                          </ActionButton>
                        )}

                        {canReassign(ticket.status) && (
                          <ActionButton
                            variant="warning"
                            onClick={() =>
                              setReassignModal({ 
                                id: ticket.id, 
                                title: ticket.title,
                                departmentId: ticket.departmentId || ticket.department?.id
                              })
                            }
                          >
                            Reassign
                          </ActionButton>
                        )}

                        <ActionButton
                          variant="secondary"
                          onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                        >
                          Details
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Reassign Modal */}
      {reassignModal && (
        <ReassignTicketModal
          ticketTitle={reassignModal.title}
          departmentId={reassignModal.departmentId}
          onClose={() => setReassignModal(null)}
          onSubmit={(reason, staffId) => handleReassignRequest(reassignModal.id, reason, reassignModal.departmentId, staffId)}
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
              variant="danger"
              disabled={submitting}
            >
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
              variant="success"
              disabled={submitting}
            >
              {submitting ? 'Resolving...' : 'Resolve Ticket'}
            </ActionButton>
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

// Reassign Ticket Modal
function ReassignTicketModal({ ticketTitle, departmentId, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffList, setStaffList] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadStaff = async () => {
      if (!departmentId) return
      
      try {
        setLoadingStaff(true)
        const response = await apiClient.get('/api/v1/users?role=staff')
        let data = response?.data || response
        
        // Convert to array
        if (data && !Array.isArray(data)) {
          data = Object.values(data).filter(Boolean)
        }
        
        // Filter staff by department
        const filteredStaff = (Array.isArray(data) ? data : []).filter((user) => {
          const isStaff = String(user.role || '').toLowerCase() === 'staff'
          const userDeptId = user.departmentId || user.department?.id
          return isStaff && userDeptId && userDeptId === departmentId
        })
        
        setStaffList(filteredStaff)
      } catch (err) {
        console.error('Failed to load staff:', err)
      } finally {
        setLoadingStaff(false)
      }
    }
    
    loadStaff()
  }, [departmentId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      return
    }
    setSubmitting(true)
    await onSubmit(reason, staffId || null)
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

          {departmentId && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="suggestedStaff"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
              >
                Suggest Staff Member (Optional)
              </label>
              {loadingStaff ? (
                <div style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Loading staff...
                </div>
              ) : staffList.length === 0 ? (
                <div style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  No staff members found in this department
                </div>
              ) : (
                <select
                  id="suggestedStaff"
                  className="input"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.72)',
                    color: '#374151',
                  }}
                >
                  <option value="">-- Select a staff member (optional) --</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName || staff.username} {staff.email ? `(${staff.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Suggest a staff member from your department for reassignment
              </p>
            </div>
          )}

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
              variant="warning"
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

export default StaffAssignedTickets
