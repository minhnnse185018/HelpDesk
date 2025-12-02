function AdminDashboard() {
  const kpis = [
    { label: 'Total Tickets / Tổng số ticket', value: 132 },
    { label: 'On-time SLA / Đúng SLA', value: '87%' },
    { label: 'Overdue Tickets / Ticket trễ hạn', value: 26 },
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-subtitle">
            Overview of tickets, SLA performance and recent activity.
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
            Tickets by Category / Ticket theo loại
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
            SLA Status / Trạng thái SLA
          </h3>
          <div className="chart-placeholder donut-chart">
            <div className="donut" />
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot legend-dot-green" />
                <span>On-time / Đúng SLA</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-dot-red" />
                <span>Overdue / Trễ hạn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">
              Recent Tickets / Ticket gần đây
            </h3>
          </div>
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

export default AdminDashboard
