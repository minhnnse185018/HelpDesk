import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../api/client'

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
      setSelectedUser(response?.data || null)
    } catch (err) {
      setActionError(err?.message || 'Failed to load user details')
    }
  }, [selectedId])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadSelectedUser()
  }, [loadSelectedUser])

  // Cập nhật role
  const handleRoleChange = async (event) => {
    const role = event.target.value
    if (!selectedId) return
    setUpdating(true)
    setActionError('')
    try {
      await apiClient.patch(`/api/v1/users/${selectedId}/role`, { role })
      await Promise.all([loadUsers(), loadSelectedUser()])
    } catch (err) {
      setActionError(err?.message || 'Failed to update role')
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
    } catch (err) {
      setActionError(err?.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  // Lọc users, không hiển thị users có role là admin
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const normalizedRole = String(user.role || '').toLowerCase()
      return normalizedRole !== 'admin'
    })
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
          <div className="filter-bar">
            <div className="filter-bar-main">
              <span className="filter-hint">
                Total Users: {filteredUsers.length}
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
                    <p className="detail-label">Department</p>
                    <p className="detail-value">
                      {selectedUser.departmentId || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="detail-label">Created At</p>
                    <p className="detail-value">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">Update Role</h4>
                  <div className="form-field">
                    <label className="form-label">Role</label>
                    <select
                      className="input"
                      value={selectedRole}
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
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">Danger Zone</h4>
                  <button
                    type="button"
                    className="btn btn-secondary subtle"
                    onClick={handleDelete}
                    disabled={deleting || updating}
                  >
                    {deleting ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </>
            ) : (
              <p>Select a user to view details.</p>
            )}
          </div>
        </aside>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this user?</p>
              <p className="modal-warning">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
              {selectedUser && (
                <div className="modal-user-info">
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
