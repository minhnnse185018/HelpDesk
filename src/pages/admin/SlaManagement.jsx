import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import {
  PageShell,
  TablePanelShell,
  DetailPanelShell,
  FormModalShell,
  DeleteConfirmModal,
  ActionButton,
} from '../../components/templates'

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
          placeholder={isCreating ? 'e.g., Critical Priority SLA' : ''}
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
          disabled={isCreating ? creating : (updating || deleting)}
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
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'e.g., 30' : ''}
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
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'e.g., 120' : ''}
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
          placeholder={isCreating ? 'Enter SLA policy description' : ''}
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
      title="SLA Policy Management"
      subtitle="Create, view, update, and delete SLA policies."
      actions={
        <ActionButton variant="success" onClick={openCreateModal}>
          Create SLA Policy
        </ActionButton>
      }
    >
      <section className="section section-with-panel">
        <TablePanelShell
          loading={loading}
          error={error}
          totalCount={slaPolicies.length}
          totalLabel="Total SLA Policies"
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'priority', label: 'Priority' },
            { key: 'responseTime', label: 'Response Time' },
            { key: 'resolutionTime', label: 'Resolution Time' },
            { key: 'active', label: 'Active' },
          ]}
          data={slaPolicies}
          renderRow={(sla) => (
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
          )}
          selectedId={selectedId}
          emptyMessage="No SLA policies found."
          loadingMessage="Loading SLA policies..."
        />

        <DetailPanelShell
          title="SLA Policy Details"
          subtitle={(item) => item.priority}
          selectedItem={selectedSla}
          emptyMessage="Select an SLA policy to view details."
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
              {deleting ? 'Deleting...' : 'Delete SLA Policy'}
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
        title="Create New SLA Policy"
        onSubmit={handleCreate}
        submitting={creating}
        submitLabel="Create SLA Policy"
        error={actionError}
      >
        {renderFormFields(true)}
      </FormModalShell>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        deleting={deleting}
        title="Delete SLA Policy"
        message="Are you sure you want to delete this SLA policy?"
        warningMessage="This action cannot be undone."
        itemInfo={selectedSla ? {
          Name: selectedSla.name,
          Priority: selectedSla.priority,
          'Response Time': formatMinutesToReadable(selectedSla.responseTimeMinutes),
          'Resolution Time': formatMinutesToReadable(selectedSla.resolutionTimeMinutes),
        } : null}
        itemLabel="SLA Policy"
      />
    </PageShell>
  )
}

export default SlaManagement
