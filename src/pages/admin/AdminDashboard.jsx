import { useEffect, useState } from 'react'

function AdminDashboard() {
  const [recentTickets, setRecentTickets] = useState([])

  const [editingTicket, setEditingTicket] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const localTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    const mockTickets = [
      {
        id: 'TCK-1024',
        category: 'WiFi',
        room: 'A1-203',
        status: 'Đang xử lý',
        statusKey: 'in-progress',
        slaDue: 'Today 17:00',
      },
      {
        id: 'TCK-1019',
        category: 'Thiết bị',
        room: 'Lab B3-105',
        status: 'Quá hạn',
        statusKey: 'overdue',
        slaDue: 'Yesterday 15:30',
      },
      {
        id: 'TCK-1015',
        category: 'Vệ sinh',
        room: 'Dorm KTX-C204',
        status: 'Đã xử lý',
        statusKey: 'resolved',
        slaDue: 'Completed',
      },
    ]
    // Merge mock data only if not present in local storage (simple dedup by ID)
    const localIds = new Set(localTickets.map(t => t.id))
    const uniqueMock = mockTickets.filter(t => !localIds.has(t.id))

    setRecentTickets([...localTickets, ...uniqueMock])
  }, [])

  const handleEditClick = (ticket) => {
    setEditingTicket(ticket)
    setNewStatus(ticket.statusKey)
    setReason(ticket.adminResponse || '')
    setIsModalOpen(true)
  }

  const handleSaveStatus = () => {
    if (!editingTicket) return

    const statusMap = {
      'new': 'Mới',
      'in-progress': 'Đang xử lý',
      'resolved': 'Đã xử lý',
      'rejected': 'Từ chối',
      'overdue': 'Quá hạn'
    }

    const updatedTicket = {
      ...editingTicket,
      statusKey: newStatus,
      status: statusMap[newStatus],
      adminResponse: reason
    }

    // Update in list
    const updatedList = recentTickets.map(t =>
      t.id === editingTicket.id ? updatedTicket : t
    )
    setRecentTickets(updatedList)

    // Update in localStorage
    // Note: This simple logic assumes all displayed tickets are in localStorage. 
    // For a real app, we'd separate mock and real data better.
    // Here we filter out mock IDs before saving if we want to persist only user tickets,
    // but for this demo, we'll try to save everything or just update the ones that exist.
    const localTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    const ticketExists = localTickets.some(t => t.id === editingTicket.id)

    let newLocalTickets
    if (ticketExists) {
      newLocalTickets = localTickets.map(t =>
        t.id === editingTicket.id ? updatedTicket : t
      )
    } else {
      // If it was a mock ticket, we add it to local storage to persist the change
      newLocalTickets = [updatedTicket, ...localTickets]
    }

    localStorage.setItem('tickets', JSON.stringify(newLocalTickets))
    setIsModalOpen(false)
  }
  const kpis = [
    { label: 'Tổng số ticket', value: 132 },
    { label: 'Đúng SLA', value: '87%' },
    { label: 'Ticket trễ hạn', value: 26 },
  ]



  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Bảng điều khiển quản trị</h2>
          <p className="page-subtitle">
            Tổng quan về ticket, hiệu suất SLA và hoạt động gần đây.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="cards-grid">
          {kpis.map((item) => (
            <div key={item.label} className="card kpi-card">
              <p className="kpi-label">{item.label}</p>
              <p className="kpi-value">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-grid-two">
        <div className="card chart-card">
          <h3 className="section-title">
            Ticket theo loại
          </h3>
          <div className="chart-placeholder bar-chart">
            <div className="bar-row">
              <span className="bar-label">CSVC</span>
              <div className="bar-track">
                <div className="bar bar-primary" style={{ width: '70%' }} />
              </div>
              <span className="bar-value">45</span>
            </div>
            <div className="bar-row">
              <span className="bar-label">WiFi</span>
              <div className="bar-track">
                <div className="bar bar-primary" style={{ width: '55%' }} />
              </div>
              <span className="bar-value">32</span>
            </div>
            <div className="bar-row">
              <span className="bar-label">Thiết bị</span>
              <div className="bar-track">
                <div className="bar bar-primary" style={{ width: '40%' }} />
              </div>
              <span className="bar-value">26</span>
            </div>
            <div className="bar-row">
              <span className="bar-label">Vệ sinh</span>
              <div className="bar-track">
                <div className="bar bar-primary" style={{ width: '30%' }} />
              </div>
              <span className="bar-value">18</span>
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="section-title">
            Trạng thái SLA
          </h3>
          <div className="chart-placeholder donut-chart">
            <div className="donut" />
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot legend-dot-green" />
                <span>Đúng SLA</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot-red" />
                <span>Trễ hạn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">
              Ticket gần đây
            </h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Mã Ticket</th>
                <th>Loại</th>
                <th>Phòng</th>
                <th>Trạng thái</th>
                <th>Hạn SLA</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>{ticket.category}</td>
                  <td>{ticket.room}</td>
                  <td>
                    <span
                      className={`status-badge status-${ticket.statusKey}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td>{ticket.slaDue}</td>
                  <td>
                    <button
                      className="btn btn-secondary subtle"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => handleEditClick(ticket)}
                    >
                      Cập nhật
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Cập nhật trạng thái Ticket</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label className="form-label">Trạng thái</label>
                <select
                  className="input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="new">Mới</option>
                  <option value="in-progress">Đang xử lý</option>
                  <option value="resolved">Đã xử lý</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Lý do / Ghi chú</label>
                <textarea
                  className="input textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do nếu từ chối hoặc ghi chú thêm..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveStatus}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
