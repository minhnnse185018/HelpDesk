import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton } from '../../components/templates'
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

function StaffReassignRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/api/v1/reassign-requests/my-requests')
      const data = response?.data || response
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load reassign requests:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to load reassign requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((req) => req.status === activeTab)

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading reassign requests...
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
      <div className="page-header">
        <div>
          <h2 className="page-title">My Reassign Requests</h2>
          <p className="page-subtitle">View your ticket/sub-ticket reassignment requests</p>
        </div>
      </div>

      <section className="section">
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <TabButton
            label={`All (${statusCounts.all})`}
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            color="#6b7280"
            bgColor="#f3f4f6"
          />
          <TabButton
            label={`Pending (${statusCounts.pending})`}
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
            color="#92400e"
            bgColor="#fef3c7"
          />
          <TabButton
            label={`Approved (${statusCounts.approved})`}
            active={activeTab === 'approved'}
            onClick={() => setActiveTab('approved')}
            color="#166534"
            bgColor="#dcfce7"
          />
          <TabButton
            label={`Rejected (${statusCounts.rejected})`}
            active={activeTab === 'rejected'}
            onClick={() => setActiveTab('rejected')}
            color="#991b1b"
            bgColor="#fee2e2"
          />
        </div>

        {filteredRequests.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>No reassign requests found.</p>
          </div>
        ) : (
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Ticket/Sub-Ticket</th>
                  <th>Reason</th>
                  <th>Preferred Assignee</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr 
                    key={request.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (request.subTicketId) {
                        navigate(`/staff/sub-tickets/${request.subTicketId}`)
                      } else if (request.ticketId) {
                        navigate(`/staff/tickets/${request.ticketId}`)
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: request.subTicketId ? '#e0f2fe' : '#dbeafe',
                          color: request.subTicketId ? '#075985' : '#1e40af',
                        }}
                      >
                        {request.subTicketId ? 'Sub-Ticket' : 'Ticket'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {request.ticket?.title || request.subTicket?.category?.name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        ID: {request.ticketId?.slice(0, 8) || request.subTicketId?.slice(0, 8)}...
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={request.reason}
                      >
                        {request.reason}
                      </div>
                    </td>
                    <td>{request.newAssignee || <span style={{ color: '#9ca3af' }}>Admin decides</span>}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Actions column - empty since click on row navigates to detail */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function TabButton({ label, active, onClick, color = '#2563eb', bgColor = '#dbeafe' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: active ? bgColor : '#f9fafb',
        color: active ? color : '#6b7280',
      }}
    >
      {label}
    </button>
  )
}

export default StaffReassignRequests
