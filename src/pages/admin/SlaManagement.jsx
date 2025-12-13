import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../api/client'

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

function SlaManagement() {
  const [slaPolicies, setSlaPolicies] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedSla, setSelectedSla] = useState(null)
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
    priority: '',
    responseTimeMinutes: '',
    resolutionTimeMinutes: '',
    description: '',
    isActive: true,
  })

  // Load SLA policies list
  const loadSlaPolicies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/api/v1/sla-policies')
      const slaPoliciesData = response?.data || {}
      // Convert object to array
      const slaPoliciesList = Array.isArray(slaPoliciesData) 
        ? slaPoliciesData 
        : Object.values(slaPoliciesData).filter(Boolean)
      setSlaPolicies(slaPoliciesList)
      if (!selectedId && slaPoliciesList.length > 0) {
        setSelectedId(slaPoliciesList[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load SLA policies')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load selected SLA policy details
  const loadSelectedSla = useCallback(async () => {
    if (!selectedId) return
    setActionError('')
    try {
      const response = await apiClient.get(`/api/v1/sla-policies/${selectedId}`)
      const sla = response?.data || null
      setSelectedSla(sla)
      if (sla) {
        setFormData({
          name: sla.name || '',
          priority: sla.priority || '',
          responseTimeMinutes: sla.responseTimeMinutes || '',
          resolutionTimeMinutes: sla.resolutionTimeMinutes || '',
          description: sla.description || '',
          isActive: sla.isActive ?? true,
        })
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to load SLA policy details')
    }
  }, [selectedId])

  useEffect(() => {
    loadSlaPolicies()
  }, [loadSlaPolicies])

  useEffect(() => {
    loadSelectedSla()
  }, [loadSelectedSla])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  // Create new SLA policy
  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setActionError('')
    try {
      const payload = {
        ...formData,
        responseTimeMinutes: Number(formData.responseTimeMinutes),
        resolutionTimeMinutes: Number(formData.resolutionTimeMinutes),
      }
      await apiClient.post('/api/v1/sla-policies', payload)
      setShowCreateModal(false)
      setFormData({ name: '', priority: '', responseTimeMinutes: '', resolutionTimeMinutes: '', description: '', isActive: true })
      await loadSlaPolicies()
    } catch (err) {
      setActionError(err?.message || 'Failed to create SLA policy')
    } finally {
      setCreating(false)
    }
  }

  // Update SLA policy
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setUpdating(true)
    setActionError('')
    try {
      const payload = {
        ...formData,
        responseTimeMinutes: Number(formData.responseTimeMinutes),
        resolutionTimeMinutes: Number(formData.resolutionTimeMinutes),
      }
      await apiClient.patch(`/api/v1/sla-policies/${selectedId}`, payload)
      await Promise.all([loadSlaPolicies(), loadSelectedSla()])
    } catch (err) {
      setActionError(err?.message || 'Failed to update SLA policy')
    } finally {
      setUpdating(false)
    }
  }

  // Delete SLA policy
  const handleDelete = () => {
    if (!selectedId) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false)
    setDeleting(true)
    setActionError('')
    try {
      await apiClient.delete(`/api/v1/sla-policies/${selectedId}`)
      setSelectedSla(null)
      setSelectedId(null)
      await loadSlaPolicies()
    } catch (err) {
      setActionError(err?.message || 'Failed to delete SLA policy')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', priority: '', responseTimeMinutes: '', resolutionTimeMinutes: '', description: '', isActive: true })
    setActionError('')
    setShowCreateModal(true)
  }

  const formatMinutesToReadable = (minutes) => {
    if (!minutes) return '—'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">SLA Policy Management</h2>
          <p className="page-subtitle">
            Create, view, update, and delete SLA policies.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Create SLA Policy
        </button>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="filter-bar">
            <div className="filter-bar-main">
              <span className="filter-hint">
                Total SLA Policies: {slaPolicies.length}
              </span>
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Priority</th>
                  <th>Response Time</th>
                  <th>Resolution Time</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading SLA policies...</td>
                  </tr>
                ) : slaPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No SLA policies found.</td>
                  </tr>
                ) : (
                  slaPolicies.map((sla) => (
                    <tr
                      key={sla.id}
                      className={selectedId === sla.id ? 'row-selected' : ''}
                      onClick={() => setSelectedId(sla.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{sla.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{sla.priority}</td>
                      <td>{formatMinutesToReadable(sla.responseTimeMinutes)}</td>
                      <td>{formatMinutesToReadable(sla.resolutionTimeMinutes)}</td>
                      <td>{sla.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          <div className="card detail-card">
            <h3 className="detail-title">SLA Policy Details</h3>
            {selectedSla ? (
              <>
                <p className="detail-subtitle">{selectedSla.priority}</p>

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
                    <label className="form-label">Priority</label>
                    <select
                      name="priority"
                      className="input"
                      value={formData.priority}
                      onChange={handleInputChange}
                      required
                      disabled={updating || deleting}
                    >
                      <option value="">Select priority</option>
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Response Time (minutes)</label>
                    <input
                      type="number"
                      name="responseTimeMinutes"
                      className="input"
                      value={formData.responseTimeMinutes}
                      onChange={handleInputChange}
                      required
                      min="1"
                      disabled={updating || deleting}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Resolution Time (minutes)</label>
                    <input
                      type="number"
                      name="resolutionTimeMinutes"
                      className="input"
                      value={formData.resolutionTimeMinutes}
                      onChange={handleInputChange}
                      required
                      min="1"
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
                    {updating ? 'Updating...' : 'Update SLA Policy'}
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
                    {deleting ? 'Deleting...' : 'Delete SLA Policy'}
                  </button>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </>
            ) : (
              <p>Select an SLA policy to view details.</p>
            )}
          </div>
        </aside>
      </section>

      {/* Create SLA Policy Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New SLA Policy</h3>
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
                    placeholder="e.g., Critical Priority SLA"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select
                    name="priority"
                    className="input"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                  >
                    <option value="">Select priority</option>
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Response Time (minutes)</label>
                  <input
                    type="number"
                    name="responseTimeMinutes"
                    className="input"
                    value={formData.responseTimeMinutes}
                    onChange={handleInputChange}
                    required
                    min="1"
                    disabled={creating}
                    placeholder="e.g., 30"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Resolution Time (minutes)</label>
                  <input
                    type="number"
                    name="resolutionTimeMinutes"
                    className="input"
                    value={formData.resolutionTimeMinutes}
                    onChange={handleInputChange}
                    required
                    min="1"
                    disabled={creating}
                    placeholder="e.g., 120"
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
                    placeholder="Enter SLA policy description"
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
                  {creating ? 'Creating...' : 'Create SLA Policy'}
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
              <h3>Delete SLA Policy</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this SLA policy?</p>
              <p className="modal-warning">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
              {selectedSla && (
                <div className="modal-user-info">
                  <p><strong>Name:</strong> {selectedSla.name}</p>
                  <p><strong>Priority:</strong> {selectedSla.priority}</p>
                  <p><strong>Response Time:</strong> {formatMinutesToReadable(selectedSla.responseTimeMinutes)}</p>
                  <p><strong>Resolution Time:</strong> {formatMinutesToReadable(selectedSla.resolutionTimeMinutes)}</p>
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
                {deleting ? 'Deleting...' : 'Delete SLA Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SlaManagement
