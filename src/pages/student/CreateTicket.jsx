function CreateTicket() {
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
              <select className="input">
                <option>CSVC</option>
                <option>WiFi</option>
                <option>Thiết bị</option>
                <option>Vệ sinh</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Mức độ ưu tiên
              </label>
              <select className="input">
                <option> Thấp</option>
                <option>Trung bình</option>
                <option>Cao</option>
                <option>Khẩn cấp</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Phòng</label>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Tòa nhà (anhpha, beta, gamma,...)"
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Phòng (202, 203,...)"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Bộ phận</label>
              <select className="input">
                <option>IT</option>
                <option>CSVC</option>
                <option>KTX</option>
              </select>
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Tiêu đề vấn đề
              </label>
              <input
                type="text"
                className="input"
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
                placeholder="Điều hòa, tivi không hoạt động, lỗi wifi,..."
              />
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Ảnh đính kèm
              </label>
              <div className="upload-area">
                <span className="upload-icon">📎</span>
                <div>
                  <p className="upload-title">
                    Click to upload or drag and drop
                  </p>
                  <p className="upload-hint">
                    Attachment / Ảnh đính kèm (PNG, JPG, PDF)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <div className="sla-hint">
              Thời gian phản hồi dự kiến
              theo SLA
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary">
                Hủy
              </button>
              <button type="button" className="btn btn-primary">
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
