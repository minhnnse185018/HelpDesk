import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import {
  PageShell,
  TablePanelShell,
  DetailPanelShell,
  FormModalShell,
  DeleteConfirmModal,
  ActionButton,
  AlertModal,
} from '../../components/templates'

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
  const [alertModal, setAlertModal] = useState(null)

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
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Category created successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to create category')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to create category'
      })
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
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Category updated successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to update category')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to update category'
      })
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
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Category deleted successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to delete category')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to delete category'
      })
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

  // Render form fields (reusable cho cả create và edit)
  const renderFormFields = (isCreating = false) => (
    <>
      <div className="form-field">
        <label className="form-label">Name</label>
        <input
          type="text"
          name="name"
          className="input"
          value={formData.name}
          onChange={handleInputChange}
          required
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'e.g., WIFI' : ''}
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
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'e.g., WF101' : ''}
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
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'Enter category description' : ''}
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
          disabled={isCreating ? creating : (updating || deleting)}
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
            disabled={isCreating ? creating : (updating || deleting)}
          />
          Active
        </label>
      </div>
    </>
  )

  return (
    <PageShell
      title="Category Management"
      subtitle="Create, view, update, and delete categories."
      actions={
        <ActionButton variant="success" onClick={openCreateModal}>
          Create Category
        </ActionButton>
      }
    >
      <section className="section section-with-panel">
        <TablePanelShell
          loading={loading}
          error={error}
          totalCount={categories.length}
          totalLabel="Total Categories"
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Department' },
            { key: 'active', label: 'Active' },
          ]}
          data={categories}
          renderRow={(category) => (
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
          )}
          selectedId={selectedId}
          emptyMessage="No categories found."
          loadingMessage="Loading categories..."
        />

        <DetailPanelShell
          title="Category Details"
          subtitle={(item) => item.code}
          selectedItem={selectedCategory}
          emptyMessage="Select a category to view details."
          deleting={deleting}
          updating={updating}
          actionError={actionError}
          dangerZoneTitle="Danger Zone"
          dangerZoneContent={
            <ActionButton
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || updating}
            >
              {deleting ? 'Deleting...' : 'Delete Category'}
            </ActionButton>
          }
        >
          <form onSubmit={handleUpdate}>
            {renderFormFields(false)}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <ActionButton
                type="submit"
                variant="success"
                disabled={updating || deleting}
              >
                {updating ? 'Saving...' : 'Save'}
              </ActionButton>
            </div>
          </form>
        </DetailPanelShell>
      </section>

      <FormModalShell
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Category"
        onSubmit={handleCreate}
        submitting={creating}
        submitLabel="Create Category"
        error={actionError}
      >
        {renderFormFields(true)}
      </FormModalShell>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        deleting={deleting}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        warningMessage="This action cannot be undone."
        itemInfo={selectedCategory ? {
          Code: selectedCategory.code,
          Name: selectedCategory.name,
          Description: selectedCategory.description || '—',
          Department: getDepartmentName(selectedCategory.departmentId),
        } : null}
        itemLabel="Category"
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
    </PageShell>
  )
}

export default CategoryManagement
