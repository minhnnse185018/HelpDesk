import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function MyTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    const localTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    setTickets(localTickets)
  }, [])

  const getStatusBadgeClass = (statusKey) => {
    switch (statusKey) {
      case 'new': return 'status-new'
      case 'in-progress': return 'status-in-progress'
      case 'resolved': return 'status-resolved'
      case 'overdue': return 'status-overdue'
      case 'rejected': return 'status-overdue' // Re-use red for rejected
      default: return 'status-new'
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ticket của tôi</h2>
          <p className="page-subtitle">Lịch sử phản ánh và trạng thái xử lý</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>
          Quay lại Dashboard
        </button>
      </div>

      <div className={`page-with-panel ${selectedTicket ? 'active' : ''}`}>
        <div className="section-with-panel">
          {/* List Panel */}
          <div className="card table-panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Ticket</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                      Chưa có ticket nào.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={selectedTicket?.id === ticket.id ? 'row-selected' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{ticket.id}</td>
                      <td>{ticket.title}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(ticket.statusKey)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>{new Date(ticket.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selectedTicket ? (
            <div className="detail-panel">
              <div className="card detail-card">
                <div className="section-header">
                  <h3 className="detail-title">{selectedTicket.title}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(selectedTicket.statusKey)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="detail-subtitle">ID: {selectedTicket.id} • {new Date(selectedTicket.timestamp).toLocaleString()}</p>

                <div className="detail-grid">
                  <div>
                    <p className="detail-label">Loại</p>
                    <p className="detail-value">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <p className="detail-label">Mức độ</p>
                    <p className="detail-value">{selectedTicket.priority}</p>
                  </div>
                  <div>
                    <p className="detail-label">Phòng</p>
                    <p className="detail-value">{selectedTicket.room}</p>
                  </div>
                  <div>
                    <p className="detail-label">Bộ phận</p>
                    <p className="detail-value">{selectedTicket.department}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">Mô tả</h4>
                  <p className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
                </div>

                {selectedTicket.fileNames && selectedTicket.fileNames.length > 0 && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">Đính kèm</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedTicket.fileNames.map((name, idx) => (
                        <span key={idx} className="pill">📎 {name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Response Section */}
                {(selectedTicket.adminResponse || selectedTicket.statusKey === 'rejected') && (
                  <div className="detail-section" style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                    <h4 className="detail-section-title" style={{ color: '#c2410c' }}>Phản hồi từ Admin</h4>
                    <p className="detail-value">{selectedTicket.adminResponse || 'Không có lý do cụ thể.'}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card detail-card empty-detail">
              <p className="empty-detail-text">Chọn một ticket để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyTickets
