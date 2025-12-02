import { useState } from 'react'

const mockTickets = [
  {
    id: 'TCK-1024',
    category: 'WiFi',
    room: 'A1-203',
    createdAt: '2025-12-01 09:15',
    slaDue: '2025-12-02 12:00',
    status: 'In Progress',
    statusKey: 'in-progress',
  },
  {
    id: 'TCK-1023',
    category: 'CSVC',
    room: 'Library 2F',
    createdAt: '2025-11-30 15:40',
    slaDue: '2025-12-01 10:00',
    status: 'New',
    statusKey: 'new',
  },
  {
    id: 'TCK-1019',
    category: 'Thiết bị',
    room: 'Lab B3-105',
    createdAt: '2025-11-28 08:20',
    slaDue: '2025-11-28 15:30',
    status: 'Overdue',
    statusKey: 'overdue',
  },
  {
    id: 'TCK-1015',
    category: 'Vệ sinh',
    room: 'Dorm KTX-C204',
    createdAt: '2025-11-25 20:05',
    slaDue: '2025-11-26 12:00',
    status: 'Resolved',
    statusKey: 'resolved',
  },
]

function MyTickets() {
  const [selectedTicket, setSelectedTicket] = useState(null)

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Tickets / Ticket của tôi</h2>
          <p className="page-subtitle">
            View and track your submitted tickets.
          </p>
        </div>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="filter-bar">
            <div className="filter-bar-main">
              <div className="search-field">
                <input
                  type="text"
                  className="input"
                  placeholder="Search by title, room… / Tìm theo tiêu đề, phòng…"
                />
              </div>
              <select className="input filter-input">
                <option>All categories / Tất cả loại</option>
                <option>CSVC</option>
                <option>WiFi</option>
                <option>Thiết bị</option>
                <option>Vệ sinh</option>
              </select>
              <select className="input filter-input">
                <option>Status / Trạng thái</option>
                <option>New</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>

          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Category / Loại</th>
                  <th>Room / Phòng</th>
                  <th>Created At / Ngày tạo</th>
                  <th>SLA Due / Hạn SLA</th>
                  <th>Status / Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {mockTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={
                      selectedTicket?.id === ticket.id ? 'row-selected' : ''
                    }
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td>{ticket.id}</td>
                    <td>{ticket.category}</td>
                    <td>{ticket.room}</td>
                    <td>{ticket.createdAt}</td>
                    <td>{ticket.slaDue}</td>
                    <td>
                      <span
                        className={`status-badge status-${ticket.statusKey}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          {selectedTicket ? (
            <div className="card detail-card">
              <h3 className="detail-title">
                Ticket Detail / Chi tiết Ticket
              </h3>
              <p className="detail-subtitle">{selectedTicket.id}</p>

              <div className="detail-grid">
                <div>
                  <p className="detail-label">Category / Loại</p>
                  <p className="detail-value">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="detail-label">Room / Phòng</p>
                  <p className="detail-value">{selectedTicket.room}</p>
                </div>
                <div>
                  <p className="detail-label">Created At / Ngày tạo</p>
                  <p className="detail-value">{selectedTicket.createdAt}</p>
                </div>
                <div>
                  <p className="detail-label">SLA Due / Hạn SLA</p>
                  <p className="detail-value">{selectedTicket.slaDue}</p>
                </div>
                <div>
                  <p className="detail-label">Status / Trạng thái</p>
                  <p className="detail-value">
                    <span
                      className={`status-badge status-${selectedTicket.statusKey}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  Timeline / Lịch sử xử lý
                </h4>
                <ul className="timeline">
                  <li className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">
                        Ticket created / Tạo ticket
                      </p>
                      <p className="timeline-meta">
                        2025-11-28 08:20 · Minh
                      </p>
                    </div>
                  </li>
                  <li className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">
                        Assigned to facility staff / Phân công nhân sự CSVC
                      </p>
                      <p className="timeline-meta">
                        2025-11-28 09:00 · Admin
                      </p>
                    </div>
                  </li>
                  <li className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">
                        In Progress / Đang xử lý
                      </p>
                      <p className="timeline-meta">
                        2025-11-28 10:15 · Staff
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="card detail-card empty-detail">
              <p className="empty-detail-text">
                Select a ticket to view details / Chọn một ticket để xem chi
                tiết
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}

export default MyTickets
