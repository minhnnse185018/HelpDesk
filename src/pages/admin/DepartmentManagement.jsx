import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from '../../api/admin'

function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
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
    fetchDepartments()
      .then((data) => {
        if (isMounted) setDepartments(data)
      })
      .catch((err) => setError(err.message || 'Không tải được phòng ban'))
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
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
      if (editingId) {
        await updateDepartment(editingId, formData)
        setMessage('Đã cập nhật phòng ban')
      } else {
        await createDepartment(formData)
        setMessage('Đã tạo phòng ban mới')
      }
      // Reload data from server
      const data = await fetchDepartments()
      setDepartments(data)
      resetForm()
      setIsModalOpen(false)
    } catch (err) {
      setError(err.message || 'Lưu phòng ban thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (department) => {
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive ?? true,
    })
    setEditingId(department.id)
    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phòng ban này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteDepartment(id)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      if (editingId === id) resetForm()
      setMessage('Đã xóa phòng ban')
    } catch (err) {
      setError(err.message || 'Xóa phòng ban thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Departments / Phòng Ban
          </h2>
          <p className="page-subtitle">
            Manage departments and their information.
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
          New Department / Thêm phòng ban
        </button>
      </div>

      <section className="section">
        {error && <p className="text-danger">{error}</p>}
        {message && <p className="text-success">{message}</p>}

        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">Departments / Phòng Ban</h3>
            {loading && <span className="badge subtle">Loading...</span>}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name / Tên</th>
                <th>Code / Mã</th>
                <th>Description / Mô tả</th>
                <th>Active / Hoạt động</th>
                <th>Actions / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.id}>
                  <td>{department.name}</td>
                  <td>{department.code}</td>
                  <td>{department.description}</td>
                  <td>
                    <span className={`badge ${department.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {department.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-button small"
                      onClick={() => handleEdit(department)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button small danger"
                      onClick={() => handleDelete(department.id)}
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
      </section>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-backdrop" />
          <Dialog.Content className="modal">
            <div className="modal-header">
              <Dialog.Title>
                {editingId ? 'Edit Department / Sửa' : 'New Department / Thêm phòng ban'}
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
                <label className="form-label">Name / Tên</label>
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Phòng Công Nghệ Thông Tin"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Code / Mã</label>
                <input
                  className="input"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. IT, HR, CSVC"
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
                  placeholder="Chi tiết về phòng ban này"
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

export default DepartmentManagement
