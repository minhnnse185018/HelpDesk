import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { formatDate } from '../../utils/ticketHelpers.jsx'

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

function AdminReassignRequests({ searchTerm = "" }) {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/api/v1/reassign-requests/all')
      const data = response?.data || response
      // API returns data as object with numeric keys, convert to array
      const dataArray = typeof data === 'object' && !Array.isArray(data) 
        ? Object.values(data) 
        : (Array.isArray(data) ? data : [])
      setRequests(dataArray)
    } catch (err) {
      console.error('Failed to load reassign requests:', err)
      setError(err?.message || 'Failed to load reassign requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const getItemName = (request) => {
    if (request.ticket) {
      return request.ticket.title
    }
    if (request.subTicket) {
      const parentTitle = request.subTicket.parentTicket?.title || 'Unknown'
      const category = request.subTicket.category?.name || 'Sub-ticket'
      return `${parentTitle} (${category})`
    }
    return 'N/A'
  }

  const getRequestType = (request) => {
    return request.ticket ? 'Ticket' : 'Sub-ticket'
  }

  const getCategoryOrDepartment = (request) => {
    if (request.subTicket) {
      return request.subTicket.category?.name || 'N/A'
    }
    if (request.ticket) {
      return request.ticket.department?.name || 'N/A'
    }
    return 'N/A'
  }

  // Filter requests based on searchTerm
  const filteredRequests = requests.filter((request) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const title = (request.ticket?.title || request.subTicket?.parentTicket?.title || '').toLowerCase()
    const requester = (request.requester?.fullName || request.requester?.username || '').toLowerCase()
    const assignee = (request.newAssigneeUser?.fullName || request.newAssigneeUser?.username || '').toLowerCase()
    const category = (request.subTicket?.category?.name || request.ticket?.department?.name || '').toLowerCase()
    const status = (request.status || '').toLowerCase()
    return title.includes(search) || requester.includes(search) || assignee.includes(search) || category.includes(search) || status.includes(search)
  })

  return (
    <div className="page" style={{ maxWidth: 'none', marginLeft: 0, paddingLeft: 0 }}>


      {loading && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading reassign requests...
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

      {!loading && !error && requests.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>No reassign requests found.</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category/Department</th>
                  <th>Requested By</th>
                  <th>Preferred Assignee</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {searchTerm ? 'No reassign requests match your search' : 'No reassign requests found'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/reassign-requests/${request.id}`, {
                      state: {
                        departmentId: request.ticket?.departmentId || request.subTicket?.parentTicket?.departmentId,
                        departmentName: request.ticket?.department?.name || request.subTicket?.parentTicket?.department?.name
                      }
                    })}
                  >
                    <td>{request.ticket?.title || request.subTicket?.parentTicket?.title || 'N/A'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: request.ticketId ? '#dbeafe' : '#fef3c7',
                          color: request.ticketId ? '#1e40af' : '#92400e',
                        }}
                      >
                        {request.ticketId ? 'Ticket' : 'Sub-ticket'}
                      </span>
                    </td>
                    <td>{request.subTicket?.category?.name || request.ticket?.department?.name || 'N/A'}</td>
                    <td>{request.requester?.fullName || request.requester?.username || 'N/A'}</td>
                    <td>{request.newAssigneeUser?.fullName || request.newAssigneeUser?.username || 'Not specified'}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/reassign-requests/${request.id}`, {
                            state: {
                              departmentId: request.ticket?.departmentId || request.subTicket?.parentTicket?.departmentId,
                              departmentName: request.ticket?.department?.name || request.subTicket?.parentTicket?.department?.name
                            }
                          })
                        }}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          backgroundColor: "rgba(99, 102, 241, 0.08)",
                          color: "#6366f1",
                          border: "1px solid rgba(99, 102, 241, 0.2)",
                          borderRadius: "14px",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          backdropFilter: "blur(40px) saturate(200%)",
                          boxShadow:
                            "0 8px 32px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(99, 102, 241, 0.1)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.12)"
                          e.currentTarget.style.transform = "translateY(-2px)"
                          e.currentTarget.style.boxShadow = "0 12px 40px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(99, 102, 241, 0.1)"
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.08)"
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "0 8px 32px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(99, 102, 241, 0.1)"
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReassignRequests
