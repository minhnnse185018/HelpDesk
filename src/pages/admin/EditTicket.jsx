import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'

function EditTicket() {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    assignedTo: '',
    departmentId: ''
  })
  
  const [staffList, setStaffList] = useState([])
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    loadTicketData()
    loadStaffList()
    loadDepartments()
  }, [id])

  const loadTicketData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/v1/tickets/${id}`)
      const ticket = response?.data || response
      
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
        assignedTo: ticket.assignedTo || ticket.assignee?.id || '',
        departmentId: ticket.departmentId || ticket.department?.id || ''
      })
    } catch (err) {
      console.error('Failed to load ticket:', err)
      setNotification({ type: 'error', message: err?.response?.data?.message || 'Failed to load ticket' })
    } finally {
      setLoading(false)
    }
  }

  const loadStaffList = async () => {
    try {
      const response = await apiClient.get('/api/v1/users')
      let data = response?.data || response
      
      if (data && !Array.isArray(data)) {
        data = Object.values(data).filter(Boolean)
      }
      
      const filteredStaff = (Array.isArray(data) ? data : []).filter(
        (user) => String(user.role || '').toLowerCase() === 'staff'
      )
      
      setStaffList(filteredStaff)
    } catch (err) {
      console.error('Failed to load staff:', err)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await apiClient.get('/api/v1/departments')
      let data = response?.data || response
      
      if (data && !Array.isArray(data)) {
        data = data.departments || data.data || Object.values(data).filter(Boolean)
      }
      
      setDepartments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setNotification({ type: 'error', message: 'Title is required' })
      return
    }

    try {
      setSubmitting(true)
      await apiClient.patch(`/api/v1/tickets/${id}`, formData)
      setNotification({ type: 'success', message: 'Ticket updated successfully!' })
      setTimeout(() => {
        navigate('/admin/tickets')
      }, 1500)
    } catch (err) {
      console.error('Failed to update ticket:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update ticket'
      setNotification({ type: 'error', message: errorMessage })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', padding: '2rem' }}>
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto',
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '3rem', 
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 600, color: '#111827' }}>Loading</div>
          <div style={{ color: '#6b7280' }}>Loading ticket data...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/tickets')}
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#111827',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(40px) saturate(200%)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Edit Ticket
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              Update ticket information
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.72)', 
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.18)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter ticket title"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter ticket description"
                />
              </div>

              {/* Two columns for Status and Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="priority"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Two columns for Staff and Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Assigned To */}
                <div>
                  <label
                    htmlFor="assignedTo"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Assign to Staff
                    {staffList.length > 0 && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>
                        ({staffList.length} available)
                      </span>
                    )}
                  </label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                    }}
                  >
                    <option value="">-- No Assignment --</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.fullName || staff.username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="departmentId"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Department
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                    }}
                  >
                    <option value="">-- No Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/tickets')}
                disabled={submitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  color: '#6b7280',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  backdropFilter: 'blur(30px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#1d1d1f',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  backdropFilter: 'blur(40px) saturate(200%)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {submitting ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            zIndex: 9999,
            backgroundColor: notification.type === 'success' ? 'rgba(220, 252, 231, 0.25)' : 'rgba(254, 226, 226, 0.25)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(134, 239, 172, 0.3)' : 'rgba(254, 202, 202, 0.3)'}`,
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(40px) saturate(200%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: '300px',
            maxWidth: '500px',
          }}
        >
          <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
            {notification.type === 'success' ? '✅' : '❌'}
          </div>
          <div
            style={{
              flex: 1,
              color: notification.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            {notification.message}
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: notification.type === 'success' ? '#166534' : '#991b1b',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: '0',
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default EditTicket
