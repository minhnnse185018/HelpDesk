import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../api/client'

function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
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
    departmentId: '',
    isActive: true,
  })

  // Load departments for dropdown
  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v1/departments')
      const departmentsData = response?.data || {}
      const departmentsList = Array.isArray(departmentsData) 
        ? departmentsData 
        : Object.values(departmentsData).filter(Boolean)
      setDepartments(departmentsList)
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }, [])

  // Load categories list
  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/api/v1/categories')
      const categoriesData = response?.data || {}
      // Convert object to array
      const categoriesList = Array.isArray(categoriesData) 
        ? categoriesData 
        : Object.values(categoriesData).filter(Boolean)
      setCategories(categoriesList)
      if (!selectedId && categoriesList.length > 0) {
        setSelectedId(categoriesList[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load selected category details
  const loadSelectedCategory = useCallback(async () => {
    if (!selectedId) return
    setActionError('')
    try {
      const response = await apiClient.get(`/api/v1/categories/${selectedId}`)
      const category = response?.data || null
      setSelectedCategory(category)
      if (category) {
        setFormData({
          name: category.name || '',
          code: category.code || '',
          description: category.description || '',
          departmentId: category.departmentId || '',
          isActive: category.isActive ?? true,
        })
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to load category details')
    }
  }, [selectedId])

  useEffect(() => {
    loadDepartments()
    loadCategories()
  }, [loadDepartments, loadCategories])

  useEffect(() => {
    loadSelectedCategory()
  }, [loadSelectedCategory])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Create new category
  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setActionError('')
    try {
      await apiClient.post('/api/v1/categories', formData)
      setShowCreateModal(false)
      setFormData({ name: '', code: '', description: '', departmentId: '', isActive: true })
      await loadCategories()
    } catch (err) {
      setActionError(err?.message || 'Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  // Update category
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setUpdating(true)
    setActionError('')
    try {
      await apiClient.patch(`/api/v1/categories/${selectedId}`, formData)
      await Promise.all([loadCategories(), loadSelectedCategory()])
    } catch (err) {
      setActionError(err?.message || 'Failed to update category')
    } finally {
      setUpdating(false)
    }
  }

  // Delete category
  const handleDelete = () => {
    if (!selectedId) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false)
    setDeleting(true)
    setActionError('')
    try {
      await apiClient.delete(`/api/v1/categories/${selectedId}`)
      setSelectedCategory(null)
      setSelectedId(null)
      await loadCategories()
    } catch (err) {
      setActionError(err?.message || 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', code: '', description: '', departmentId: '', isActive: true })
    setActionError('')
    setShowCreateModal(true)
  }

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId)
    return dept?.name || '—'
  }

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">Category Management</h2>
          <p className="page-subtitle">
            Create, view, update, and delete categories.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Create Category
        </button>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="filter-bar">
            <div className="filter-bar-main">
              <span className="filter-hint">
                Total Categories: {categories.length}
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
                  <th>Department</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>Loading categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No categories found.</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className={selectedId === category.id ? 'row-selected' : ''}
                      onClick={() => setSelectedId(category.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{category.code}</td>
                      <td>{category.name}</td>
                      <td>{getDepartmentName(category.departmentId)}</td>
                      <td>{category.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          <div className="card detail-card">
            <h3 className="detail-title">Category Details</h3>
            {selectedCategory ? (
              <>
                <p className="detail-subtitle">{selectedCategory.code}</p>

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
                    <label className="form-label">Department</label>
                    <select
                      name="departmentId"
                      className="input"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      required
                      disabled={updating || deleting}
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
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
                    {updating ? 'Updating...' : 'Update Category'}
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
                    {deleting ? 'Deleting...' : 'Delete Category'}
                  </button>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </>
            ) : (
              <p>Select a category to view details.</p>
            )}
          </div>
        </aside>
      </section>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Category</h3>
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
                    placeholder="e.g., WIFI"
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
                    placeholder="e.g., WF101"
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
                    placeholder="Enter category description"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Department</label>
                  <select
                    name="departmentId"
                    className="input"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
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
                  {creating ? 'Creating...' : 'Create Category'}
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
              <h3>Delete Category</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this category?</p>
              <p className="modal-warning">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
              {selectedCategory && (
                <div className="modal-user-info">
                  <p><strong>Code:</strong> {selectedCategory.code}</p>
                  <p><strong>Name:</strong> {selectedCategory.name}</p>
                  <p><strong>Description:</strong> {selectedCategory.description || '—'}</p>
                  <p><strong>Department:</strong> {getDepartmentName(selectedCategory.departmentId)}</p>
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
                {deleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryManagement
