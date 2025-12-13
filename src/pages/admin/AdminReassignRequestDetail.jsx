import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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

function getStatusBadge(status) {
  const configs = {
    pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
    approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
    rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
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

function AdminReassignRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewStatus, setReviewStatus] = useState('approved')
  const [reviewNote, setReviewNote] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [staffList, setStaffList] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        // First get the reassign request
        const requestRes = await apiClient.get(`/api/v1/reassign-requests/${id}`)
        const requestData = requestRes?.data || requestRes
        setRequest(requestData)

        // Get department ID - prioritize navigation state, then API data
        let departmentId = location.state?.departmentId
        
        // If no state, extract from request data
        if (!departmentId) {
          // For regular ticket
          if (requestData?.ticket?.departmentId) {
            departmentId = requestData.ticket.departmentId
          }
          // For sub-ticket, get from parent ticket
          else if (requestData?.subTicket?.parentTicket?.departmentId) {
            departmentId = requestData.subTicket.parentTicket.departmentId
          }
        }

        console.log('🔍 Department ID:', departmentId)

        // Fetch all staff
        const staffRes = await apiClient.get('/api/v1/users?role=staff')
        const staffData = staffRes?.data || staffRes || []
        
        // Convert to array
        let allStaff = typeof staffData === 'object' && !Array.isArray(staffData)
          ? Object.values(staffData)
          : (Array.isArray(staffData) ? staffData : [])

        console.log('📋 Total staff fetched:', allStaff.length)

        // Filter staff by department
        let filteredStaff = allStaff
        if (departmentId) {
          filteredStaff = allStaff.filter(staff => staff.departmentId === departmentId)
          console.log(`✅ Filtered staff for department ${departmentId}:`, filteredStaff.length, 'staff')
          console.log('👥 Filtered staff list:', filteredStaff.map(s => ({ name: s.username, dept: s.departmentId })))
        } else {
          console.log('⚠️ No department ID found, showing all staff')
        }

        setStaffList(filteredStaff)

        // Pre-fill if already specified
        if (requestData?.newAssigneeUser?.id) {
          setNewAssignee(requestData.newAssigneeUser.id)
        }
      } catch (err) {
        console.error('Failed to load reassign request:', err)
        setError(err?.message || 'Failed to load reassign request')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const payload = {
        action: reviewStatus === 'approved' ? 'approve' : 'reject',
        reviewNote: reviewNote.trim() || undefined,
      }

      if (reviewStatus === 'approved' && newAssignee) {
        payload.newAssignee = newAssignee
      }

      await apiClient.patch(`/api/v1/reassign-requests/${id}/review`, payload)

      // Update local state
      setRequest((prev) => ({
        ...prev,
        status: reviewStatus,
        reviewNote: reviewNote.trim(),
      }))

      alert('Review submitted successfully')
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert('Failed to submit review: ' + (err?.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading reassign request...
        </div>
      </div>
    )
  }

  if (error || !request) {
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
          {error || 'Reassign request not found'}
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

  const isPending = request.status === 'pending'
  const itemType = request.ticketId ? 'Ticket' : 'Sub-ticket'
  const itemTitle = request.ticket?.title || 
    (request.subTicket?.parentTicket?.title 
      ? `${request.subTicket.parentTicket.title} (${request.subTicket.category?.name || 'Sub-ticket'})`
      : request.subTicket?.category?.name || 'N/A')

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Reassign Request Detail</h2>
          <p className="page-subtitle">#{request.id.slice(0, 8)}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/admin/tickets')}
        >
          Back to List
        </button>
      </div>

      {/* Request Info */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {itemTitle}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: request.ticketId ? '#dbeafe' : '#fef3c7',
                  color: request.ticketId ? '#1e40af' : '#92400e',
                }}
              >
                {itemType}
              </span>
              {getStatusBadge(request.status)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem 1.5rem',
          }}
        >
          <InfoItem label="Requested By">
            {request.requester?.fullName || request.requester?.username || 'N/A'}
          </InfoItem>
          <InfoItem label="Preferred New Assignee">
            {request.newAssigneeUser?.fullName || request.newAssigneeUser?.username || 'Not specified'}
          </InfoItem>
          <InfoItem label="Created At">
            {formatDate(request.createdAt)}
          </InfoItem>
          {request.reviewedAt && (
            <InfoItem label="Reviewed At">
              {formatDate(request.reviewedAt)}
            </InfoItem>
          )}
          {request.reviewer && (
            <InfoItem label="Reviewed By">
              {request.reviewer.fullName || 'N/A'}
            </InfoItem>
          )}
        </div>
      </div>

      {/* Reason */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Reason for Reassignment</h4>
        <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>
          {request.reason || 'No reason provided'}
        </p>
      </div>

      {/* Review Note (if already reviewed) */}
      {request.reviewNote && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Review Note</h4>
          <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>
            {request.reviewNote}
          </p>
        </div>
      )}

      {/* Review Form (only for pending) */}
      {isPending && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Review Request</h4>

          <form onSubmit={handleSubmitReview}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reviewStatus"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
              >
                Decision <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="reviewStatus"
                    value="approved"
                    checked={reviewStatus === 'approved'}
                    onChange={(e) => setReviewStatus(e.target.value)}
                  />
                  <span>Approve</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="reviewStatus"
                    value="rejected"
                    checked={reviewStatus === 'rejected'}
                    onChange={(e) => setReviewStatus(e.target.value)}
                  />
                  <span>Reject</span>
                </label>
              </div>
            </div>

            {reviewStatus === 'approved' && (
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="newAssignee"
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
                >
                  Select New Assignee (Optional)
                </label>
                <div style={{ marginBottom: '0.5rem' }}>
                  {(request.ticket?.department?.name || request.subTicket?.parentTicket?.department?.name) && (
                    <p style={{ fontSize: '0.75rem', color: '#374151', marginBottom: '0.25rem', fontWeight: 500 }}>
                      <strong>Department:</strong> {request.ticket?.department?.name || request.subTicket?.parentTicket?.department?.name}
                    </p>
                  )}
                  {request.subTicket?.category?.name && (
                    <p style={{ fontSize: '0.75rem', color: '#374151', marginBottom: '0.25rem', fontWeight: 500 }}>
                      <strong>Category:</strong> {request.subTicket.category.name}
                    </p>
                  )}
                </div>
                <select
                  id="newAssignee"
                  className="input"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                >
                  <option value="">-- Select Staff ({staffList.length} available) --</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName || staff.username} ({staff.email})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Leave empty to let system auto-assign
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reviewNote"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
              >
                Review Note (Optional)
              </label>
              <textarea
                id="reviewNote"
                rows={4}
                className="input"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add any comments or notes about your decision..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={submitting}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  backgroundColor: "rgba(107, 114, 128, 0.08)",
                  color: "#6b7280",
                  border: "1px solid rgba(107, 114, 128, 0.2)",
                  borderRadius: "14px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  backdropFilter: "blur(40px) saturate(200%)",
                  boxShadow:
                    "0 8px 32px rgba(107, 114, 128, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(107, 114, 128, 0.1)",
                  opacity: submitting ? 0.5 : 1,
                }}
                onMouseOver={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "rgba(107, 114, 128, 0.12)"
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(107, 114, 128, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(107, 114, 128, 0.1)"
                  }
                }}
                onMouseOut={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = "rgba(107, 114, 128, 0.08)"
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(107, 114, 128, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(107, 114, 128, 0.1)"
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  backgroundColor: reviewStatus === 'approved' 
                    ? "rgba(34, 197, 94, 0.08)" 
                    : "rgba(239, 68, 68, 0.08)",
                  color: reviewStatus === 'approved' ? "#16a34a" : "#dc2626",
                  border: reviewStatus === 'approved' 
                    ? "1px solid rgba(34, 197, 94, 0.2)" 
                    : "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "14px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  backdropFilter: "blur(40px) saturate(200%)",
                  boxShadow: reviewStatus === 'approved'
                    ? "0 8px 32px rgba(34, 197, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(34, 197, 94, 0.1)"
                    : "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)",
                  opacity: submitting ? 0.5 : 1,
                }}
                onMouseOver={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = reviewStatus === 'approved'
                      ? "rgba(34, 197, 94, 0.12)"
                      : "rgba(239, 68, 68, 0.12)"
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = reviewStatus === 'approved'
                      ? "0 12px 40px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(34, 197, 94, 0.1)"
                      : "0 12px 40px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)"
                  }
                }}
                onMouseOut={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = reviewStatus === 'approved'
                      ? "rgba(34, 197, 94, 0.08)"
                      : "rgba(239, 68, 68, 0.08)"
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = reviewStatus === 'approved'
                      ? "0 8px 32px rgba(34, 197, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(34, 197, 94, 0.1)"
                      : "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)"
                  }
                }}
              >
                {submitting ? 'Submitting...' : `${reviewStatus === 'approved' ? 'Approve' : 'Reject'} Request`}
              </button>
            </div>
          </form>
        </div>
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

export default AdminReassignRequestDetail
