import { useState, useEffect } from 'react'
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

function AdminReassignRequests() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const endpoint =
        activeTab === 'pending'
          ? '/api/v1/reassign-requests/pending'
          : '/api/v1/reassign-requests/all'
      const response = await apiClient.get(endpoint)
      const data = response?.data || response
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load reassign requests:', err)
      setError(err?.message || 'Failed to load reassign requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [activeTab])

  const getItemName = (request) => {
    if (request.ticket) {
      return request.ticket.title
    }
    if (request.subTicket) {
      const category = request.subTicket.category?.name || 'Sub-ticket'
      const parentTitle = request.subTicket.parentTicket?.title || ''
      return parentTitle ? `${category} - ${parentTitle}` : category
    }
    return 'N/A'
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Reassign Requests</h2>
          <p className="page-subtitle">Review and manage staff reassignment requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '1.5rem',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'pending' ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'all' ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          All
        </button>
      </div>

      {/* Content */}
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
                  <th>ID</th>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Requested By</th>
                  <th>Preferred Assignee</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/reassign-requests/${request.id}`)}
                  >
                    <td>#{request.id.slice(0, 8)}</td>
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
                    <td>{getItemName(request)}</td>
                    <td>{request.requestedBy?.fullName || 'N/A'}</td>
                    <td>{request.newAssigneeUser?.fullName || 'Not specified'}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/reassign-requests/${request.id}`)
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReassignRequests
