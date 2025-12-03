import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function CreateTicket() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    category: 'CSVC',
    priority: 'Thấp',
    building: '',
    room: '',
    department: 'IT',
    customDepartment: '',
    title: '',
    description: '',
    files: []
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      setFormData(prev => {
        const updatedFiles = [...prev.files, ...selectedFiles]
        if (updatedFiles.length > 10) {
          alert('Bạn chỉ được phép tải lên tối đa 10 ảnh.')
          return prev
        }
        return { ...prev, files: updatedFiles }
      })
    }
  }

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = () => {
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: formData.category,
      room: `${formData.building}-${formData.room}`,
      status: 'Mới',
      statusKey: 'new',
      slaDue: 'Tomorrow 10:00', // Mock SLA
      title: formData.title,
      description: formData.description,
      department: formData.department === 'Khác' ? formData.customDepartment : formData.department,
      priority: formData.priority,
      fileNames: formData.files.map(f => f.name),
      isRead: false,
      timestamp: new Date().toISOString()
    }

    // Save to localStorage
    const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    localStorage.setItem('tickets', JSON.stringify([newTicket, ...existingTickets]))

    navigate('/student/dashboard')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Tạo phản ánh mới
          </h2>
          <p className="page-subtitle">
            Bạn gặp vấn đề về trang thiết bị, cơ sở vật chất trong khuôn viên trường? Hãy tạo phản ánh ngay!
          </p>
        </div>
      </div>

      <section className="section">
        <div className="card form-card two-column-form">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">
                Loại phản ánh
              </label>
              <select
                className="input"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="CSVC">CSVC</option>
                <option value="WiFi">WiFi</option>
                <option value="Thiết bị">Thiết bị</option>
                <option value="Vệ sinh">Vệ sinh</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Mức độ ưu tiên
              </label>
              <select
                className="input"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Thấp">Thấp</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cao">Cao</option>
                <option value="Khẩn cấp">Khẩn cấp</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Phòng</label>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  placeholder="Tòa nhà (anhpha, beta, gamma,...)"
                />
                <input
                  type="text"
                  className="input"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="Phòng (202, 203,...)"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Bộ phận</label>
              <select
                className="input"
                name="department"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="IT">IT</option>
                <option value="CSVC">CSVC</option>
                <option value="KTX">KTX</option>
                <option value="Khác">Khác</option>
              </select>
              {formData.department === 'Khác' && (
                <input
                  type="text"
                  className="input"
                  style={{ marginTop: '0.5rem' }}
                  name="customDepartment"
                  value={formData.customDepartment}
                  onChange={handleChange}
                  placeholder="Nhập tên bộ phận..."
                />
              )}
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Tiêu đề vấn đề
              </label>
              <input
                type="text"
                className="input"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Tóm tắt vấn đề"
              />
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Mô tả chi tiết vấn đề
              </label>
              <textarea
                className="input textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Điều hòa, tivi không hoạt động, lỗi wifi,..."
              />
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Ảnh đính kèm
              </label>
              <div className="upload-area" style={{ position: 'relative' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
                <span className="upload-icon">📎</span>
                <div>
                  <p className="upload-hint">
                    Tối đa 10 ảnh (PNG, JPG)
                  </p>
                </div>
              </div>

              {formData.files.length > 0 && (
                <div className="image-preview-grid">
                  {formData.files.map((file, index) => (
                    <div key={index} className="image-preview-item">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="preview-thumbnail"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveFile(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-footer">
            <div className="sla-hint">
              Thời gian phản hồi dự kiến
              theo SLA
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                Gửi phản ánh
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CreateTicket
