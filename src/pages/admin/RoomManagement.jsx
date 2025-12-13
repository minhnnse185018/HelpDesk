import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../api/client'

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

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">Room Management</h2>
          <p className="page-subtitle">
            Create, view, update, and delete rooms.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Create Room
        </button>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="filter-bar">
            <div className="filter-bar-main">
              <span className="filter-hint">
                Total Rooms: {rooms.length}
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
                  <th>Floor</th>
                  <th>Capacity</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading rooms...</td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No rooms found.</td>
                  </tr>
                ) : (
                  rooms.map((room) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          <div className="card detail-card">
            <h3 className="detail-title">Room Details</h3>
            {selectedRoom ? (
              <>
                <p className="detail-subtitle">{selectedRoom.code}</p>

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
                    <label className="form-label">Floor</label>
                    <input
                      type="number"
                      name="floor"
                      className="input"
                      value={formData.floor}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="6"
                      disabled={updating || deleting}
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
                    {updating ? 'Updating...' : 'Update Room'}
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
                    {deleting ? 'Deleting...' : 'Delete Room'}
                  </button>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}
              </>
            ) : (
              <p>Select a room to view details.</p>
            )}
          </div>
        </aside>
      </section>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Room</h3>
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
                    placeholder="e.g., Conference Room A1"
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
                    placeholder="e.g., A101"
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
                    max="5"
                    disabled={creating}
                    placeholder="e.g., 1"
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
                    disabled={creating}
                    placeholder="e.g., 20"
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
                    placeholder="Enter room description"
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
                  {creating ? 'Creating...' : 'Create Room'}
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
              <h3>Delete Room</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this room?</p>
              <p className="modal-warning">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
              {selectedRoom && (
                <div className="modal-user-info">
                  <p><strong>Code:</strong> {selectedRoom.code}</p>
                  <p><strong>Name:</strong> {selectedRoom.name}</p>
                  <p><strong>Floor:</strong> {selectedRoom.floor}</p>
                  <p><strong>Capacity:</strong> {selectedRoom.capacity}</p>
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
                {deleting ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomManagement
