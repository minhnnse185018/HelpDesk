import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../../api/admin'

function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultPriority: 'Medium',
    slaResponse: '',
    slaResolve: '',
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
    fetchCategories()
      .then((data) => {
        if (isMounted) setCategories(data)
      })
      .catch((err) => setError(err.message || 'Cannot load categories'))
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultPriority: 'Medium',
      slaResponse: '',
      slaResolve: '',
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
        const updated = await updateCategory(editingId, formData)
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
        setMessage('Đã cập nhật category')
      } else {
        const created = await createCategory(formData)
        setCategories((prev) => [...prev, created])
        setMessage('Đã tạo category mới')
      }
      resetForm()
      setIsModalOpen(false)
    } catch (err) {
      setError(err.message || 'Lưu category thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description,
      defaultPriority: category.defaultPriority,
      slaResponse: category.slaResponse,
      slaResolve: category.slaResolve,
    })
    setEditingId(category.id)
    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa category này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      if (editingId === id) resetForm()
      setMessage('Đã xóa category')
    } catch (err) {
      setError(err.message || 'Xóa category thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Feedback Categories / Loại phản ánh
          </h2>
          <p className="page-subtitle">
            Manage categories and SLA settings for tickets.
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
          New Category / Thêm loại mới
        </button>
      </div>

      <section className="section">
        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">Categories</h3>
            {loading && <span className="badge subtle">Loading...</span>}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Category Name / Tên loại</th>
                <th>Description / Mô tả</th>
                <th>Default Priority / Ưu tiên mặc định</th>
                <th>SLA Response Time / SLA phản hồi</th>
                <th>SLA Resolve Time / SLA xử lý</th>
                <th>Actions / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>{category.defaultPriority}</td>
                  <td>{category.slaResponse}</td>
                  <td>{category.slaResolve}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button small"
                      onClick={() => handleEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button small danger"
                      onClick={() => handleDelete(category.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!categories.length && (
                <tr>
                  <td colSpan="6">No categories yet</td>
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
                {editingId ? 'Edit Category / Sửa' : 'New Category / Thêm loại mới'}
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
                />
              </div>
              <div className="form-field">
                <label className="form-label">Description / Mô tả</label>
                <input
                  className="input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">Default Priority / Ưu tiên</label>
                <select
                  className="input"
                  value={formData.defaultPriority}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultPriority: e.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">SLA Response / SLA phản hồi</label>
                <input
                  className="input"
                  value={formData.slaResponse}
                  onChange={(e) =>
                    setFormData({ ...formData, slaResponse: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">SLA Resolve / SLA xử lý</label>
                <input
                  className="input"
                  value={formData.slaResolve}
                  onChange={(e) =>
                    setFormData({ ...formData, slaResolve: e.target.value })
                  }
                />
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

export default CategoryManagement
