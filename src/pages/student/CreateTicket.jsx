function CreateTicket() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Create New Ticket / Tạo phản ánh mới
          </h2>
          <p className="page-subtitle">
            Describe your facility, WiFi or equipment issue.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="card form-card two-column-form">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">
                Category / Loại phản ánh
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
                Priority / Mức độ ưu tiên
              </label>
              <select className="input">
                <option>Low / Thấp</option>
                <option>Medium / Trung bình</option>
                <option>High / Cao</option>
                <option>Urgent / Khẩn cấp</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Room / Phòng</label>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Building / Tòa nhà (vd. A1)"
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Room / Phòng (vd. 203)"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Department / Bộ phận</label>
              <select className="input">
                <option>IT</option>
                <option>CSVC</option>
                <option>KTX</option>
              </select>
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Title / Tiêu đề vấn đề
              </label>
              <input
                type="text"
                className="input"
                placeholder="Short summary / Tóm tắt ngắn"
              />
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Description / Mô tả chi tiết
              </label>
              <textarea
                className="input textarea"
                rows={4}
                placeholder="Provide more details about the issue / Mô tả chi tiết vấn đề"
              />
            </div>

            <div className="form-field full-width">
              <label className="form-label">
                Attachment / Ảnh đính kèm
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
              Expected response time based on SLA / Thời gian phản hồi dự kiến
              theo SLA
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary">
                Cancel / Hủy
              </button>
              <button type="button" className="btn btn-primary">
                Submit Ticket / Gửi phản ánh
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CreateTicket
