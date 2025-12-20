import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [alertModal, setAlertModal] = useState(null)

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
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Department created successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to create department')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to create department'
      })
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
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Department updated successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to update department')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to update department'
      })
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
      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Department deleted successfully!'
      })
    } catch (err) {
      setActionError(err?.message || 'Failed to delete department')
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Failed to delete department'
      })
    } finally {
      setDeleting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', code: '', description: '', isActive: true })
    setActionError('')
    setShowCreateModal(true)
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
          placeholder={isCreating ? 'e.g., Information Technology Department' : ''}
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
          placeholder={isCreating ? 'e.g., IT' : ''}
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
          placeholder={isCreating ? 'Enter department description' : ''}
        />
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
      title="Department Management"
      actions={
        <ActionButton variant="success" onClick={openCreateModal}>
          Create Department
        </ActionButton>
      }
    >
      <section className="section section-with-panel">
        <TablePanelShell
          loading={loading}
          error={error}
          totalCount={departments.length}
          totalLabel="Total Departments"
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
            { key: 'active', label: 'Active' },
          ]}
          data={departments}
          renderRow={(dept) => (
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
          )}
          selectedId={selectedId}
          emptyMessage="No departments found."
          loadingMessage="Loading departments..."
        />

        <DetailPanelShell
          title="Department Details"
          subtitle={(item) => item.code}
          selectedItem={selectedDepartment}
          emptyMessage="Select a department to view details."
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
              {deleting ? 'Deleting...' : 'Delete Department'}
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
        title="Create New Department"
        onSubmit={handleCreate}
        submitting={creating}
        submitLabel="Create Department"
        error={actionError}
      >
        {renderFormFields(true)}
      </FormModalShell>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        deleting={deleting}
        title="Delete Department"
        message="Are you sure you want to delete this department?"
        warningMessage="This action cannot be undone."
        itemInfo={selectedDepartment ? {
          Code: selectedDepartment.code,
          Name: selectedDepartment.name,
          Description: selectedDepartment.description || '—',
        } : null}
        itemLabel="Department"
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

export default DepartmentManagement
