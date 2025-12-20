import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../api/client'
import { ActionButton, DeleteConfirmModal, AlertModal, WarningMessage } from '../../components/templates'
import { formatDate } from '../../utils/ticketHelpers.jsx'

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
]

function UserManagement() {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [departments, setDepartments] = useState([])
  const [assigningDepartment, setAssigningDepartment] = useState(false)
  const [activeTab, setActiveTab] = useState('staff')
  const [alertModal, setAlertModal] = useState(null)
  
  // Form state để lưu giá trị tạm thời trước khi save
  const [formData, setFormData] = useState({
    role: '',
    departmentId: '',
  })

  // Load danh sách departments
  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v1/departments')
      const deptData = response?.data || []
      const deptList = Array.isArray(deptData) ? deptData : Object.values(deptData).filter(Boolean)
      setDepartments(deptList)
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }, [])

  // Load danh sách users
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/api/v1/users')
      const usersData = response?.data || {}
      // Convert object to array
      const usersList = Object.values(usersData).filter(Boolean)
      setUsers(usersList)
      if (!selectedId && usersList.length > 0) {
        setSelectedId(usersList[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load chi tiết user được chọn
  const loadSelectedUser = useCallback(async () => {
    if (!selectedId) return
    setActionError('')
    try {
      const response = await apiClient.get(`/api/v1/users/${selectedId}`)
      const user = response?.data || null
      setSelectedUser(user)
      if (user) {
        setFormData({
          role: user.role || '',
          departmentId: user.departmentId || '',
        })
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to load user details')
    }
  }, [selectedId])

  useEffect(() => {
    loadUsers()
    loadDepartments()
  }, [loadUsers, loadDepartments])

  useEffect(() => {
    loadSelectedUser()
  }, [loadSelectedUser])

  // Handle form input changes (chỉ update state, không gọi API)
  const handleRoleChange = (event) => {
    const role = event.target.value
    setFormData((prev) => {
      // Khi chuyển từ staff sang student, reset departmentId
      if (prev.role === 'staff' && role === 'student') {
        return { ...prev, role, departmentId: '' }
      }
      return { ...prev, role }
    })
  }

  const handleDepartmentChange = (event) => {
    const departmentId = event.target.value
    setFormData((prev) => ({ ...prev, departmentId }))
  }

  // Save tất cả thay đổi
  const handleSave = async () => {
    if (!selectedId) return
    
    setUpdating(true)
    setActionError('')
    
    try {
      const currentRole = selectedUser?.role || ''
      const newRole = formData.role
      const currentDeptId = selectedUser?.departmentId || ''
      const newDeptId = formData.departmentId || ''
      
      // BƯỚC 1: Update role trước nếu có thay đổi
      // Điều này quan trọng vì khi chuyển từ student sang staff, 
      // cần role là staff trước khi có thể assign department
      if (newRole && newRole !== currentRole) {
        try {
          await apiClient.patch(`/api/v1/users/${selectedId}/role`, { role: newRole })
          // Reload user để có role mới trước khi assign department
          await loadSelectedUser()
        } catch (err) {
          // Backend sẽ validate và quăng lỗi nếu staff có ticket không thể chuyển role
          const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update role'
          throw new Error(errorMessage)
        }
      }
      
      // BƯỚC 2: Xử lý department sau khi role đã được update
      // Nếu chuyển từ staff sang student → unassign department
      if (currentRole === 'staff' && newRole === 'student' && currentDeptId) {
        // Unassign department khi chuyển từ staff sang student
        try {
          await apiClient.delete(`/api/v1/users/${selectedId}/assign-department`)
        } catch (err) {
          // Nếu API không hỗ trợ delete, có thể backend yêu cầu gọi API khác
          console.warn('Failed to unassign department when changing to student:', err)
          // Vẫn tiếp tục vì role đã được update
        }
      }
      // Nếu user là staff (role mới hoặc role hiện tại) và có thay đổi department
      else if (newRole === 'staff' && newDeptId !== currentDeptId) {
        // Chỉ xử lý department nếu role mới là staff
        if (newDeptId) {
          // Assign department mới
          await apiClient.post(`/api/v1/users/${selectedId}/assign-department`, { 
            departmentId: newDeptId 
          })
        } else if (currentDeptId && !newDeptId && currentRole === 'staff') {
          // Bỏ chọn department (unassign) - chỉ khi đang là staff
          try {
            await apiClient.delete(`/api/v1/users/${selectedId}/assign-department`)
          } catch (err) {
            console.warn('Failed to unassign department:', err)
          }
        }
      }
      
      // Reload data sau khi update
      await Promise.all([loadUsers(), loadSelectedUser()])
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'User updated successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to save changes')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to save changes'
      })
    } finally {
      setUpdating(false)
    }
  }

  // Xóa user
  const handleDelete = () => {
    if (!selectedId) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false)
    setDeleting(true)
    setActionError('')
    try {
      await apiClient.delete(`/api/v1/users/${selectedId}`)
      setSelectedUser(null)
      setSelectedId(null)
      await loadUsers()
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'User deleted successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to delete user')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to delete user'
      })
    } finally {
      setDeleting(false)
    }
  }

  // Lọc users theo tab đang chọn
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const normalizedRole = String(user.role || '').toLowerCase()
      return normalizedRole === activeTab
    })
  }, [users, activeTab])

  // Đếm số lượng users theo role
  const userCounts = useMemo(() => {
    const counts = { staff: 0, student: 0 }
    users.forEach((user) => {
      const role = String(user.role || '').toLowerCase()
      if (role === 'staff') counts.staff++
      if (role === 'student') counts.student++
    })
    return counts
  }, [users])

  const selectedRole = useMemo(() => {
    if (!selectedUser?.role) return ''
    return String(selectedUser.role).toLowerCase()
  }, [selectedUser])

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">
            View details, update roles, and delete user accounts.
          </p>
        </div>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'staff' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'staff' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Staff ({userCounts.staff})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'student' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'student' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Student ({userCounts.student})
            </button>
          </div>

          <div className="filter-bar">
            <div className="filter-bar-main">
              <span className="filter-hint">
              </span>
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={selectedId === user.id ? 'row-selected' : ''}
                      onClick={() => setSelectedId(user.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{user.email}</td>
                      <td>{user.username}</td>
                      <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                      <td>{user.isVerified ? 'Yes' : 'No'}</td>
                      <td>{user.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          <div className="card detail-card">
            <h3 className="detail-title">User Details</h3>
            {selectedUser ? (
              <>
                <p className="detail-subtitle">{selectedUser.email}</p>

                <div className="detail-grid">
                  <div>
                    <p className="detail-label">Username</p>
                    <p className="detail-value">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="detail-label">Role</p>
                    <p className="detail-value" style={{ textTransform: 'capitalize' }}>
                      {selectedUser.role}
                    </p>
                  </div>
                  <div>
                    <p className="detail-label">Verified</p>
                    <p className="detail-value">
                      {selectedUser.isVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="detail-label">Active</p>
                    <p className="detail-value">
                      {selectedUser.isActive ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="detail-label">Phone Number</p>
                    <p className="detail-value">
                      {selectedUser.phoneNumber || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="detail-label">Full Name</p>
                    <p className="detail-value">
                      {selectedUser.fullName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="detail-label">Created At</p>
                    <p className="detail-value">
                      {selectedUser.createdAt ? formatDate(selectedUser.createdAt) : '—'}
                    </p>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="form-field">
                    <label className="form-label">Update Role</label>
                    <select
                      className="input"
                      value={formData.role}
                      onChange={handleRoleChange}
                      disabled={updating || deleting}
                    >
                      <option value="" disabled>
                        Select role
                      </option>
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {/* Hiển thị warning khi chuyển từ staff sang student */}
                    {formData.role === 'student' && selectedRole === 'staff' && (
                      <WarningMessage 
                        message="Department will be unassigned when role changes to Student!" 
                      />
                    )}
                  </div>
                </div>

                {/* Chỉ hiển thị department field khi role mới chọn là staff */}
                {/* Nếu chọn student, field sẽ ẩn ngay lập tức (chưa cần save) */}
                {formData.role === 'staff' && (
                  <div className="detail-section">
                    <div className="form-field">
                      <label className="form-label">Assign Department</label>
                      <select
                        className="input"
                        value={formData.departmentId}
                        onChange={handleDepartmentChange}
                        disabled={updating || deleting}
                      >
                        <option value="">
                          {selectedUser?.departmentId ? '-- Unassign Department --' : '-- Select Department --'}
                        </option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {selectedUser?.departmentId && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          Current: {departments.find(d => d.id === selectedUser.departmentId)?.name || selectedUser.departmentId}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <ActionButton
                      variant="success"
                      onClick={handleSave}
                      disabled={updating || deleting}
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </ActionButton>
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">Danger Zone</h4>
                  <ActionButton
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleting || updating}
                  >
                    {deleting ? 'Deleting...' : 'Delete User'}
                  </ActionButton>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </>
            ) : (
              <p>Select a user to view details.</p>
            )}
          </div>
        </aside>
      </section>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        deleting={deleting}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        warningMessage="This action cannot be undone."
        itemInfo={selectedUser ? {
          Email: selectedUser.email,
          Username: selectedUser.username,
          Role: selectedUser.role,
        } : null}
        itemLabel="User"
      />

      {alertModal && (
        <AlertModal
          isOpen={!!alertModal}
          message={alertModal.message}
          title={alertModal.title || 'Notice'}
          type={alertModal.type || 'info'}
          onClose={() => setAlertModal(null)}
        />
      )}
    </div>
  )
}

export default UserManagement
