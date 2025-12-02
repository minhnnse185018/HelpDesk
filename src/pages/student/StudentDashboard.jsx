function StudentDashboard() {
  const overviewStats = [
    { label: 'Open Tickets / Ticket đang mở', value: 3 },
    { label: 'In Progress / Đang xử lý', value: 5 },
    { label: 'Resolved / Đã xử lý', value: 18 },
  ]

  const recentTickets = [
    {
      id: 'TCK-1024',
      category: 'WiFi',
      room: 'A1-203',
      status: 'In Progress',
      statusKey: 'in-progress',
      slaDue: 'Today 17:00',
    },
    {
      id: 'TCK-1023',
      category: 'CSVC',
      room: 'Library 2F',
      status: 'New',
      statusKey: 'new',
      slaDue: 'Tomorrow 10:00',
    },
    {
      id: 'TCK-1019',
      category: 'Thiết bị',
      room: 'Lab B3-105',
      status: 'Overdue',
      statusKey: 'overdue',
      slaDue: 'Yesterday 15:30',
    },
    {
      id: 'TCK-1015',
      category: 'Vệ sinh',
      room: 'Dorm KTX-C204',
      status: 'Resolved',
      statusKey: 'resolved',
      slaDue: 'Completed',
    },
  ]

  const filters = ['All', 'New', 'In Progress', 'Resolved', 'Overdue']

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Dashboard</h2>
          <p className="page-subtitle">
            Hi Minh 👋 – Student / Sinh viên
          </p>
        </div>
        <button type="button" className="btn btn-primary">
          Create New Ticket / Tạo phản ánh mới
        </button>
      </div>

      <section className="section">
        <div className="cards-grid">
          {overviewStats.map((item) => (
            <div key={item.label} className="card kpi-card">
              <p className="kpi-label">{item.label}</p>
              <p className="kpi-value">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h3 className="section-title">
            Recent Tickets / Ticket gần đây
          </h3>
          <div className="filter-pills">
            {filters.map((filter) => (
              <button key={filter} type="button" className="pill">
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Category / Loại</th>
                <th>Room / Phòng</th>
                <th>Status / Trạng thái</th>
                <th>SLA Due / Hạn SLA</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default StudentDashboard
