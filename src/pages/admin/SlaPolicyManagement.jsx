import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  createSlaPolicy,
  deleteSlaPolicy,
  fetchSlaPolicies,
  updateSlaPolicy,
} from '../../api/admin'

function SlaPolicyManagement() {
  const [policies, setPolicies] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    priority: 'medium',
    responseTimeMinutes: '',
    resolutionTimeMinutes: '',
    description: '',
    isActive: true,
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const priorityOptions = [
    { value: 'critical', label: 'Critical / Nghiêm trọng', color: 'badge-danger' },
    { value: 'high', label: 'High / Cao', color: 'badge-warning' },
    { value: 'medium', label: 'Medium / Trung bình', color: 'badge-info' },
    { value: 'low', label: 'Low / Thấp', color: 'badge-gray' },
  ]

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchSlaPolicies()
      .then((data) => {
        if (isMounted) setPolicies(data)
      })
      .catch((err) => setError(err.message || 'Không tải được SLA policies'))
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 'medium',
      responseTimeMinutes: '',
      resolutionTimeMinutes: '',
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
        responseTimeMinutes: parseInt(formData.responseTimeMinutes),
        resolutionTimeMinutes: parseInt(formData.resolutionTimeMinutes),
      }

      if (editingId) {
        await updateSlaPolicy(editingId, payload)
        setMessage('Đã cập nhật SLA policy')
      } else {
        await createSlaPolicy(payload)
        setMessage('Đã tạo SLA policy mới')
      }
      // Reload data from server
      const data = await fetchSlaPolicies()
      setPolicies(data)
      resetForm()
      setIsModalOpen(false)
    } catch (err) {
      setError(err.message || 'Lưu SLA policy thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (policy) => {
    setFormData({
      name: policy.name,
      priority: policy.priority,
      responseTimeMinutes: policy.responseTimeMinutes.toString(),
      resolutionTimeMinutes: policy.resolutionTimeMinutes.toString(),
      description: policy.description,
      isActive: policy.isActive ?? true,
    })
    setEditingId(policy.id)
    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa SLA policy này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteSlaPolicy(id)
      setPolicies((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) resetForm()
      setMessage('Đã xóa SLA policy')
    } catch (err) {
      setError(err.message || 'Xóa SLA policy thất bại')
    } finally {
      setSaving(false)
    }
  }

  const getPriorityBadge = (priority) => {
    const option = priorityOptions.find((opt) => opt.value === priority)
    return option ? option.color : 'badge-gray'
  }

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">SLA Policies / Chính sách SLA</h2>
          <p className="page-subtitle">
            Manage Service Level Agreement policies for ticket priorities.
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
          New SLA Policy / Thêm chính sách
        </button>
      </div>

      <section className="section">
        {error && <p className="text-danger">{error}</p>}
        {message && <p className="text-success">{message}</p>}

        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">SLA Policies</h3>
            {loading && <span className="badge subtle">Loading...</span>}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name / Tên</th>
                <th>Priority / Độ ưu tiên</th>
                <th>Response Time / Thời gian phản hồi</th>
                <th>Resolution Time / Thời gian giải quyết</th>
                <th>Description / Mô tả</th>
                <th>Active / Hoạt động</th>
                <th>Actions / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td>{policy.name}</td>
                  <td>
                    <span className={`badge ${getPriorityBadge(policy.priority)}`}>
                      {policy.priority}
                    </span>
                  </td>
                  <td>{formatMinutes(policy.responseTimeMinutes)}</td>
                  <td>{formatMinutes(policy.resolutionTimeMinutes)}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.875rem' }}>
                    {policy.description}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        policy.isActive ? 'badge-success' : 'badge-gray'
                      }`}
                    >
                      {policy.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-button small"
                      onClick={() => handleEdit(policy)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button small danger"
                      onClick={() => handleDelete(policy.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!policies.length && (
                <tr>
                  <td colSpan="7">No SLA policies yet</td>
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
                {editingId ? 'Edit SLA Policy / Sửa' : 'New SLA Policy / Thêm chính sách'}
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
                <label className="form-label">Name / Tên chính sách</label>
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Critical Priority SLA"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Priority / Độ ưu tiên</label>
                <select
                  className="input"
                  required
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">
                  Response Time / Thời gian phản hồi (minutes)
                </label>
                <input
                  className="input"
                  type="number"
                  required
                  min="1"
                  value={formData.responseTimeMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, responseTimeMinutes: e.target.value })
                  }
                  placeholder="e.g. 30, 120, 480"
                />
                <small style={{ color: '#666', fontSize: '0.75rem' }}>
                  30 min, 1h = 60 min, 8h = 480 min, 24h = 1440 min
                </small>
              </div>
              <div className="form-field">
                <label className="form-label">
                  Resolution Time / Thời gian giải quyết (minutes)
                </label>
                <input
                  className="input"
                  type="number"
                  required
                  min="1"
                  value={formData.resolutionTimeMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, resolutionTimeMinutes: e.target.value })
                  }
                  placeholder="e.g. 120, 480, 1440"
                />
                <small style={{ color: '#666', fontSize: '0.75rem' }}>
                  2h = 120 min, 8h = 480 min, 24h = 1440 min
                </small>
              </div>
              <div className="form-field">
                <label className="form-label">Description / Mô tả</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Chi tiết về chính sách SLA này"
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

export default SlaPolicyManagement
