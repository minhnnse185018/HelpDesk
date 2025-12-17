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

function RoomManagement() {
  const [rooms, setRooms] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
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
    floor: '',
    capacity: '',
    description: '',
    isActive: true,
  })

  // Load rooms list
  const loadRooms = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/api/v1/rooms')
      const roomsData = response?.data || {}
      // Convert object to array
      const roomsList = Array.isArray(roomsData) 
        ? roomsData 
        : Object.values(roomsData).filter(Boolean)
      setRooms(roomsList)
      if (!selectedId && roomsList.length > 0) {
        setSelectedId(roomsList[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load selected room details
  const loadSelectedRoom = useCallback(async () => {
    if (!selectedId) return
    setActionError('')
    try {
      const response = await apiClient.get(`/api/v1/rooms/${selectedId}`)
      const room = response?.data || null
      setSelectedRoom(room)
      if (room) {
        setFormData({
          name: room.name || '',
          code: room.code || '',
          floor: room.floor || '',
          capacity: room.capacity || '',
          description: room.description || '',
          isActive: room.isActive ?? true,
        })
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to load room details')
    }
  }, [selectedId])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    loadSelectedRoom()
  }, [loadSelectedRoom])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  // Create new room
  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setActionError('')
    try {
      const payload = {
        ...formData,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
      }
      await apiClient.post('/api/v1/rooms', payload)
      setShowCreateModal(false)
      setFormData({ name: '', code: '', floor: '', capacity: '', description: '', isActive: true })
      await loadRooms()
    } catch (err) {
      setActionError(err?.message || 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  // Update room
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setUpdating(true)
    setActionError('')
    try {
      const payload = {
        ...formData,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
      }
      await apiClient.put(`/api/v1/rooms/${selectedId}`, payload)
      await Promise.all([loadRooms(), loadSelectedRoom()])
    } catch (err) {
      setActionError(err?.message || 'Failed to update room')
    } finally {
      setUpdating(false)
    }
  }

  // Delete room
  const handleDelete = () => {
    if (!selectedId) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false)
    setDeleting(true)
    setActionError('')
    try {
      await apiClient.delete(`/api/v1/rooms/${selectedId}`)
      setSelectedRoom(null)
      setSelectedId(null)
      await loadRooms()
    } catch (err) {
      setActionError(err?.message || 'Failed to delete room')
    } finally {
      setDeleting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', code: '', floor: '', capacity: '', description: '', isActive: true })
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
          placeholder={isCreating ? 'e.g., Conference Room A1' : ''}
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
          placeholder={isCreating ? 'e.g., A101' : ''}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Floor</label>
        <input
          type="number"
          name="floor"
          className="input"
          value={formData.floor}
          onChange={handleInputChange}
          required
          min="1"
          max={isCreating ? "5" : "6"}
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'e.g., 1' : ''}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Capacity</label>
        <input
          type="number"
          name="capacity"
          className="input"
          value={formData.capacity}
          onChange={handleInputChange}
          required
          min="20"
          max="40"
          disabled={isCreating ? creating : (updating || deleting)}
          placeholder={isCreating ? 'e.g., 20' : ''}
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
          placeholder={isCreating ? 'Enter room description' : ''}
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
      title="Room Management"
      subtitle="Create, view, update, and delete rooms."
      actions={
        <ActionButton variant="success" onClick={openCreateModal}>
          Create Room
        </ActionButton>
      }
    >
      <section className="section section-with-panel">
        <TablePanelShell
          loading={loading}
          error={error}
          totalCount={rooms.length}
          totalLabel="Total Rooms"
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'floor', label: 'Floor' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'active', label: 'Active' },
          ]}
          data={rooms}
          renderRow={(room) => (
            <tr
              key={room.id}
              className={selectedId === room.id ? 'row-selected' : ''}
              onClick={() => setSelectedId(room.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>{room.code}</td>
              <td>{room.name}</td>
              <td>{room.floor}</td>
              <td>{room.capacity}</td>
              <td>{room.isActive ? 'Yes' : 'No'}</td>
            </tr>
          )}
          selectedId={selectedId}
          emptyMessage="No rooms found."
          loadingMessage="Loading rooms..."
        />

        <DetailPanelShell
          title="Room Details"
          subtitle={(item) => item.code}
          selectedItem={selectedRoom}
          emptyMessage="Select a room to view details."
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
              {deleting ? 'Deleting...' : 'Delete Room'}
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
        title="Create New Room"
        onSubmit={handleCreate}
        submitting={creating}
        submitLabel="Create Room"
        error={actionError}
      >
        {renderFormFields(true)}
      </FormModalShell>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        deleting={deleting}
        title="Delete Room"
        message="Are you sure you want to delete this room?"
        warningMessage="This action cannot be undone."
        itemInfo={selectedRoom ? {
          Code: selectedRoom.code,
          Name: selectedRoom.name,
          Floor: selectedRoom.floor,
          Capacity: selectedRoom.capacity,
        } : null}
        itemLabel="Room"
      />
    </PageShell>
  )
}

export default RoomManagement
