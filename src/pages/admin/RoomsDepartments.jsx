import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  createDepartment,
  createRoom,
  deleteDepartment,
  deleteRoom,
  fetchDepartments,
  fetchRooms,
  updateDepartment,
  updateRoom,
} from '../../api/admin'

function RoomsDepartments() {
  const [activeTab, setActiveTab] = useState('rooms')
  const [rooms, setRooms] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [roomForm, setRoomForm] = useState({
    building: '',
    room: '',
    department: '',
    notes: '',
  })
  const [roomEditingId, setRoomEditingId] = useState(null)
  const [roomModalOpen, setRoomModalOpen] = useState(false)

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    type: '',
    email: '',
    phone: '',
  })
  const [deptEditingId, setDeptEditingId] = useState(null)
  const [deptModalOpen, setDeptModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    Promise.all([fetchRooms(), fetchDepartments()])
      .then(([roomData, departmentData]) => {
        if (!isMounted) return
        setRooms(roomData)
        setDepartments(departmentData)
      })
      .catch((err) => setError(err.message || 'Không tải được dữ liệu'))
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [])

  const resetRoomForm = () => {
    setRoomForm({ building: '', room: '', department: '', notes: '' })
    setRoomEditingId(null)
  }

  const resetDepartmentForm = () => {
    setDepartmentForm({ name: '', type: '', email: '', phone: '' })
    setDeptEditingId(null)
  }

  const handleRoomSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (roomEditingId) {
        const updated = await updateRoom(roomEditingId, roomForm)
        setRooms((prev) => prev.map((item) => (item.id === roomEditingId ? updated : item)))
        setMessage('Đã cập nhật phòng')
      } else {
        const created = await createRoom(roomForm)
        setRooms((prev) => [...prev, created])
        setMessage('Đã thêm phòng mới')
      }
      resetRoomForm()
      setRoomModalOpen(false)
    } catch (err) {
      setError(err.message || 'Lưu phòng thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDepartmentSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (deptEditingId) {
        const updated = await updateDepartment(deptEditingId, departmentForm)
        setDepartments((prev) =>
          prev.map((item) => (item.id === deptEditingId ? updated : item))
        )
        setMessage('Đã cập nhật bộ phận')
      } else {
        const created = await createDepartment(departmentForm)
        setDepartments((prev) => [...prev, created])
        setMessage('Đã thêm bộ phận mới')
      }
      resetDepartmentForm()
      setDeptModalOpen(false)
    } catch (err) {
      setError(err.message || 'Lưu bộ phận thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Xóa phòng này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteRoom(id)
      setRooms((prev) => prev.filter((item) => item.id !== id))
      if (roomEditingId === id) resetRoomForm()
      setMessage('Đã xóa phòng')
    } catch (err) {
      setError(err.message || 'Xóa phòng thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Xóa bộ phận này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteDepartment(id)
      setDepartments((prev) => prev.filter((item) => item.id !== id))
      if (deptEditingId === id) resetDepartmentForm()
      setMessage('Đã xóa bộ phận')
    } catch (err) {
      setError(err.message || 'Xóa bộ phận thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Rooms &amp; Departments / Phòng &amp; Bộ phận
          </h2>
          <p className="page-subtitle">
            Manage building rooms and responsible departments.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'rooms' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Rooms / Phòng
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'departments' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('departments')}
          >
            Departments / Bộ phận
          </button>
        </div>

        {error && <p className="text-danger">{error}</p>}
        {message && <p className="text-success">{message}</p>}

        {activeTab === 'rooms' && (
          <>
            <div className="card table-card">
              <div className="section-header">
                <h3 className="section-title">Rooms / Phòng</h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    resetRoomForm()
                    setRoomModalOpen(true)
                    setMessage('')
                    setError('')
                  }}
                >
                  Add new / Thêm mới
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Building / Tòa nhà</th>
                    <th>Room / Phòng</th>
                    <th>Department in charge / Bộ phận phụ trách</th>
                    <th>Notes / Ghi chú</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td>{room.building}</td>
                      <td>{room.room}</td>
                      <td>{room.department}</td>
                      <td>{room.notes}</td>
                      <td>
                        <button
                          className="link-button small"
                          type="button"
                          onClick={() => {
                            setRoomForm({
                              building: room.building,
                              room: room.room,
                              department: room.department,
                              notes: room.notes,
                            })
                            setRoomEditingId(room.id)
                            setRoomModalOpen(true)
                            setMessage('')
                            setError('')
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="link-button small danger"
                          type="button"
                          onClick={() => handleDeleteRoom(room.id)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rooms.length && (
                    <tr>
                      <td colSpan="5">No rooms yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'departments' && (
          <>
            <div className="card table-card">
              <div className="section-header">
                <h3 className="section-title">Departments / Bộ phận</h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    resetDepartmentForm()
                    setDeptModalOpen(true)
                    setMessage('')
                    setError('')
                  }}
                >
                  Add new / Thêm mới
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Department Name / Tên bộ phận</th>
                    <th>Type / Loại</th>
                    <th>Contact email / Email liên hệ</th>
                    <th>Phone / Số điện thoại</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td>{department.name}</td>
                      <td>{department.type}</td>
                      <td>{department.email}</td>
                      <td>{department.phone}</td>
                      <td>
                        <button
                          className="link-button small"
                          type="button"
                          onClick={() => {
                            setDepartmentForm({
                              name: department.name,
                              type: department.type,
                              email: department.email,
                              phone: department.phone,
                            })
                            setDeptEditingId(department.id)
                            setDeptModalOpen(true)
                            setMessage('')
                            setError('')
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="link-button small danger"
                          type="button"
                          onClick={() => handleDeleteDepartment(department.id)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!departments.length && (
                    <tr>
                      <td colSpan="5">No departments yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Dialog.Root open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-backdrop" />
          <Dialog.Content className="modal">
            <div className="modal-header">
              <Dialog.Title>
                {roomEditingId ? 'Edit Room / Sửa phòng' : 'Add Room / Thêm phòng'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => resetRoomForm()}
                >
                  ×
                </button>
              </Dialog.Close>
            </div>
            <form className="form-grid" onSubmit={handleRoomSubmit}>
              <div className="form-field">
                <label className="form-label">Building / Tòa nhà</label>
                <input
                  className="input"
                  required
                  value={roomForm.building}
                  onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Room / Phòng</label>
                <input
                  className="input"
                  required
                  value={roomForm.room}
                  onChange={(e) => setRoomForm({ ...roomForm, room: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Department / Bộ phận</label>
                <input
                  className="input"
                  value={roomForm.department}
                  onChange={(e) => setRoomForm({ ...roomForm, department: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Notes / Ghi chú</label>
                <input
                  className="input"
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : roomEditingId ? 'Update' : 'Create'}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      resetRoomForm()
                      setRoomModalOpen(false)
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-backdrop" />
          <Dialog.Content className="modal">
            <div className="modal-header">
              <Dialog.Title>
                {deptEditingId ? 'Edit Department / Sửa bộ phận' : 'Add Department / Thêm bộ phận'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => resetDepartmentForm()}
                >
                  ×
                </button>
              </Dialog.Close>
            </div>
            <form className="form-grid" onSubmit={handleDepartmentSubmit}>
              <div className="form-field">
                <label className="form-label">Name / Tên</label>
                <input
                  className="input"
                  required
                  value={departmentForm.name}
                  onChange={(e) =>
                    setDepartmentForm({ ...departmentForm, name: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">Type / Loại</label>
                <input
                  className="input"
                  value={departmentForm.type}
                  onChange={(e) =>
                    setDepartmentForm({ ...departmentForm, type: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={departmentForm.email}
                  onChange={(e) =>
                    setDepartmentForm({ ...departmentForm, email: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">Phone / SĐT</label>
                <input
                  className="input"
                  value={departmentForm.phone}
                  onChange={(e) =>
                    setDepartmentForm({ ...departmentForm, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : deptEditingId ? 'Update' : 'Create'}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      resetDepartmentForm()
                      setDeptModalOpen(false)
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

export default RoomsDepartments
