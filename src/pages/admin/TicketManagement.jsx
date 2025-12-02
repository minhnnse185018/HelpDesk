import { useState } from 'react'

const mockTicketsAdmin = [
  {
    id: 'TCK-1024',
    category: 'WiFi',
    room: 'A1-203',
    requestedBy: 'Minh',
    assignedTo: 'IT Staff 1',
    status: 'In Progress',
    statusKey: 'in-progress',
    slaDue: 'Today 17:00',
    priority: 'High',
  },
  {
    id: 'TCK-1023',
    category: 'CSVC',
    room: 'Library 2F',
    requestedBy: 'Lan',
    assignedTo: 'CSVC Staff 2',
    status: 'New',
    statusKey: 'new',
    slaDue: 'Tomorrow 10:00',
    priority: 'Medium',
  },
  {
    id: 'TCK-1019',
    category: 'Thiết bị',
    room: 'Lab B3-105',
    requestedBy: 'Huy',
    assignedTo: 'IT Staff 3',
    status: 'Overdue',
    statusKey: 'overdue',
    slaDue: 'Yesterday 15:30',
    priority: 'Urgent',
  },
]

function TicketManagement() {
  const [selectedTicket, setSelectedTicket] = useState(mockTicketsAdmin[0])

  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Tickets Management / Quản lý Ticket
          </h2>
          <p className="page-subtitle">
            Filter, assign and update facility helpdesk tickets.
          </p>
        </div>
      </div>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="filter-bar">
            <div className="filter-bar-main">
              <select className="input filter-input">
                <option>Status / Trạng thái</option>
                <option>New</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Overdue</option>
              </select>
              <select className="input filter-input">
                <option>Category / Loại</option>
                <option>CSVC</option>
                <option>WiFi</option>
                <option>Thiết bị</option>
                <option>Vệ sinh</option>
              </select>
              <select className="input filter-input">
                <option>Department / Bộ phận</option>
                <option>IT</option>
                <option>CSVC</option>
                <option>KTX</option>
              </select>
              <select className="input filter-input">
                <option>SLA / SLA</option>
                <option>On-time / Đúng SLA</option>
                <option>Overdue / Trễ hạn</option>
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
                  <th>Requested by / Người gửi</th>
                  <th>Assigned to / Người xử lý</th>
                  <th>Status / Trạng thái</th>
                  <th>SLA Due / Hạn SLA</th>
                  <th>Actions / Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {mockTicketsAdmin.map((ticket) => (
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
                    <td>{ticket.requestedBy}</td>
                    <td>{ticket.assignedTo}</td>
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
                        type="button"
                        className="icon-button"
                        aria-label="More actions"
                      >
                        ⋯
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-panel">
          {selectedTicket && (
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
                  <p className="detail-label">Requested by / Người gửi</p>
                  <p className="detail-value">{selectedTicket.requestedBy}</p>
                </div>
                <div>
                  <p className="detail-label">Assigned to / Người xử lý</p>
                  <p className="detail-value">{selectedTicket.assignedTo}</p>
                </div>
                <div>
                  <p className="detail-label">Priority / Mức độ ưu tiên</p>
                  <p className="detail-value">{selectedTicket.priority}</p>
                </div>
                <div>
                  <p className="detail-label">SLA Due / Hạn SLA</p>
                  <p className="detail-value">{selectedTicket.slaDue}</p>
                </div>
                <div>
                  <p className="detail-label">SLA Status / Trạng thái SLA</p>
                  <p className="detail-value">
                    <span className="sla-badge sla-badge-warning">
                      2h remaining / Còn 2 giờ
                    </span>
                  </p>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  Assign &amp; Actions / Phân công &amp; Thao tác
                </h4>
                <div className="form-field">
                  <label className="form-label">
                    Assign to / Gán cho
                  </label>
                  <select className="input">
                    <option>IT Staff 1</option>
                    <option>IT Staff 2</option>
                    <option>CSVC Staff 1</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary">
                    Mark In Progress / Đánh dấu đang xử lý
                  </button>
                  <button type="button" className="btn btn-primary">
                    Resolve / Đã xử lý
                  </button>
                  <button type="button" className="btn btn-secondary subtle">
                    Escalate / Chuyển cấp trên
                  </button>
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
                        2025-12-01 09:15 · Minh
                      </p>
                    </div>
                  </li>
                  <li className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">
                        Assigned to IT Staff 1
                      </p>
                      <p className="timeline-meta">
                        2025-12-01 09:30 · Admin
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
                        2025-12-01 10:00 · IT Staff 1
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}

export default TicketManagement
