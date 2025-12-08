import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  updateRoom,
} from '../../api/admin'

function RoomManagement() {
  const [rooms, setRooms] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    floor: '',
    capacity: '',
    description: '',
    isActive: true,
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchRooms()
      .then((data) => {
        if (isMounted) setRooms(data)
      })
      .catch((err) => setError(err.message || 'Không tải được phòng'))
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      floor: '',
      capacity: '',
      description: '',
      isActive: true,
    })
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const payload = {
        ...formData,
        floor: formData.floor ? parseInt(formData.floor) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      }
      
      if (editingId) {
        await updateRoom(editingId, payload)
        setMessage('Đã cập nhật phòng')
      } else {
        await createRoom(payload)
        setMessage('Đã tạo phòng mới')
      }
      // Reload data from server
      const data = await fetchRooms()
      setRooms(data)
      resetForm()
      setIsModalOpen(false)
    } catch (err) {
      setError(err.message || 'Lưu phòng thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (room) => {
    setFormData({
      name: room.name,
      code: room.code,
      floor: room.floor ? room.floor.toString() : '',
      capacity: room.capacity ? room.capacity.toString() : '',
      description: room.description,
      isActive: room.isActive ?? true,
    })
    setEditingId(room.id)
    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phòng này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteRoom(id)
      setRooms((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) resetForm()
      setMessage('Đã xóa phòng')
    } catch (err) {
      setError(err.message || 'Xóa phòng thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Rooms / Phòng
          </h2>
          <p className="page-subtitle">
            Manage rooms and their information.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
            setMessage('')
            setError('')
          }}
        >
          New Room / Thêm phòng
        </button>
      </div>

      <section className="section">
        {error && <p className="text-danger">{error}</p>}
        {message && <p className="text-success">{message}</p>}

        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">Rooms / Phòng</h3>
            {loading && <span className="badge subtle">Loading...</span>}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name / Tên</th>
                <th>Code / Mã</th>
                <th>Floor / Tầng</th>
                <th>Capacity / Sức chứa</th>
                <th>Description / Mô tả</th>
                <th>Active / Hoạt động</th>
                <th>Actions / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>{room.code}</td>
                  <td>{room.floor}</td>
                  <td>{room.capacity}</td>
                  <td>{room.description}</td>
                  <td>
                    <span className={`badge ${room.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {room.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-button small"
                      onClick={() => handleEdit(room)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button small danger"
                      onClick={() => handleDelete(room.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!rooms.length && (
                <tr>
                  <td colSpan="7">No rooms yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-backdrop" />
          <Dialog.Content className="modal">
            <div className="modal-header">
              <Dialog.Title>
                {editingId ? 'Edit Room / Sửa' : 'New Room / Thêm phòng'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close"
                  onClick={resetForm}
                >
                  ×
                </button>
              </Dialog.Close>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Name / Tên phòng</label>
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Phòng họp A1"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Code / Mã phòng</label>
                <input
                  className="input"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. A101, 202"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Floor / Tầng</label>
                <input
                  className="input"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g. 1, 2, 3"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Capacity / Sức chứa</label>
                <input
                  className="input"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g. 20, 30, 50"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Description / Mô tả</label>
                <textarea
                  className="input"
                  rows="2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Chi tiết về phòng này"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <span style={{ marginLeft: '0.5rem' }}>Active / Hoạt động</span>
                </label>
              </div>
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      resetForm()
                      setIsModalOpen(false)
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
              {message && <p className="text-success">{message}</p>}
              {error && <p className="text-danger">{error}</p>}
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

export default RoomManagement
