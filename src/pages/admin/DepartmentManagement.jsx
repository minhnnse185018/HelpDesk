import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../api/client'

function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  })

  // Load departments list
  const loadDepartments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/api/v1/departments')
      const departmentsData = response?.data || {}
      // Convert object to array if needed
      const departmentsList = Array.isArray(departmentsData) 
        ? departmentsData 
        : Object.values(departmentsData).filter(Boolean)
      setDepartments(departmentsList)
      if (!selectedId && departmentsList.length > 0) {
        setSelectedId(departmentsList[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load selected department details
  const loadSelectedDepartment = useCallback(async () => {
    if (!selectedId) return
    setActionError('')
    try {
      const response = await apiClient.get(`/api/v1/departments/${selectedId}`)
      const dept = response?.data || null
      setSelectedDepartment(dept)
      if (dept) {
        setFormData({
          name: dept.name || '',
          code: dept.code || '',
          description: dept.description || '',
          isActive: dept.isActive ?? true,
        })
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to load department details')
    }
  }, [selectedId])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  useEffect(() => {
    loadSelectedDepartment()
  }, [loadSelectedDepartment])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Create new department
  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setActionError('')
    try {
      await apiClient.post('/api/v1/departments', formData)
      setShowCreateModal(false)
      setFormData({ name: '', code: '', description: '', isActive: true })
      await loadDepartments()
    } catch (err) {
      setActionError(err?.message || 'Failed to create department')
    } finally {
      setCreating(false)
    }
  }

  // Update department
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setUpdating(true)
    setActionError('')
    try {
      await apiClient.put(`/api/v1/departments/${selectedId}`, formData)
      await Promise.all([loadDepartments(), loadSelectedDepartment()])
    } catch (err) {
      setActionError(err?.message || 'Failed to update department')
    } finally {
      setUpdating(false)
    }
  }

  // Delete department
  const handleDelete = () => {
    if (!selectedId) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false)
    setDeleting(true)
    setActionError('')
    try {
      await apiClient.delete(`/api/v1/departments/${selectedId}`)
      setSelectedDepartment(null)
      setSelectedId(null)
      await loadDepartments()
    } catch (err) {
      setActionError(err?.message || 'Failed to delete department')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', code: '', description: '', isActive: true })
    setActionError('')
    setShowCreateModal(true)
  }

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">Department Management</h2>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Create Department
        </button>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="filter-bar">
            <div className="filter-bar-main">
              <span className="filter-hint">
                Total Departments: {departments.length}
              </span>
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>Loading departments...</td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No departments found.</td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr
                      key={dept.id}
                      className={selectedId === dept.id ? 'row-selected' : ''}
                      onClick={() => setSelectedId(dept.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{dept.code}</td>
                      <td>{dept.name}</td>
                      <td>{dept.description || '—'}</td>
                      <td>{dept.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          <div className="card detail-card">
            <h3 className="detail-title">Department Details</h3>
            {selectedDepartment ? (
              <>
                <p className="detail-subtitle">{selectedDepartment.code}</p>

                <form onSubmit={handleUpdate}>
                  <div className="form-field">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={updating || deleting}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Code</label>
                    <input
                      type="text"
                      name="code"
                      className="input"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      disabled={updating || deleting}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="input"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={updating || deleting}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label checkbox-label">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        disabled={updating || deleting}
                      />
                      Active
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updating || deleting}
                  >
                    {updating ? 'Updating...' : 'Update Department'}
                  </button>
                </form>

                <div className="detail-section">
                  <h4 className="detail-section-title">Danger Zone</h4>
                  <button
                    type="button"
                    className="btn btn-secondary subtle"
                    onClick={handleDelete}
                    disabled={deleting || updating}
                  >
                    {deleting ? 'Deleting...' : 'Delete Department'}
                  </button>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </>
            ) : (
              <p>Select a department to view details.</p>
            )}
          </div>
        </aside>
      </section>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Department</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                    placeholder="e.g., Information Technology Department"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Code</label>
                  <input
                    type="text"
                    name="code"
                    className="input"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                    placeholder="e.g., IT"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="input"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={creating}
                    placeholder="Enter department description"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={creating}
                    />
                    Active
                  </label>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Department</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this department?</p>
              <p className="modal-warning">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
              {selectedDepartment && (
                <div className="modal-user-info">
                  <p><strong>Code:</strong> {selectedDepartment.code}</p>
                  <p><strong>Name:</strong> {selectedDepartment.name}</p>
                  <p><strong>Description:</strong> {selectedDepartment.description || '—'}</p>
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
                {deleting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentManagement
