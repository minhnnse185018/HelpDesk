import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function StudentDashboard() {
  const navigate = useNavigate()
  const [recentTickets, setRecentTickets] = useState([])
  const [stats, setStats] = useState({
    open: 0,
    processing: 0,
    resolved: 0
  })

  useEffect(() => {
    const localTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
    setRecentTickets(localTickets)

    // Calculate stats
    const open = localTickets.filter(t => t.statusKey === 'new').length
    const processing = localTickets.filter(t => t.statusKey === 'in-progress').length
    const resolved = localTickets.filter(t => t.statusKey === 'resolved').length

    setStats({ open, processing, resolved })
  }, [])

  const overviewStats = [
    { label: 'Ticket đang mở', value: stats.open },
    { label: 'Đang xử lý', value: stats.processing },
    { label: 'Đã xử lý', value: stats.resolved },
  ]

  const filters = ['Tất cả', 'Mới', 'Đang xử lý', 'Đã xử lý', 'Quá hạn']

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Bảng điều khiển sinh viên</h2>
          <p className="page-subtitle">
            Xin chào Minh 👋 – Sinh viên
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/student/create-ticket')}>
          Tạo phản ánh mới
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
            Ticket gần đây
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
                <th>Mã Ticket</th>
                <th>Loại</th>
                <th>Phòng</th>
                <th>Trạng thái</th>
                <th>Hạn SLA</th>
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
