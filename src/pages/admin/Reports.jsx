function Reports() {
  const categoryRows = [
    { category: 'CSVC', total: 45, overdue: 8 },
    { category: 'WiFi', total: 32, overdue: 10 },
    { category: 'Thiết bị', total: 26, overdue: 5 },
    { category: 'Vệ sinh', total: 18, overdue: 3 },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports / Báo cáo</h2>
          <p className="page-subtitle">
            SLA performance and ticket volume analytics.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="filter-bar">
          <div className="filter-bar-main">
            <input
              type="text"
              className="input filter-input"
              placeholder="Date range / Khoảng thời gian"
            />
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
          </div>
        </div>
      </section>

      <section className="section section-grid-two">
        <div className="card chart-card">
          <h3 className="section-title">SLA Report / Báo cáo SLA</h3>
          <div className="chart-placeholder donut-chart">
            <div className="donut" />
            <div className="donut-center">
              <p className="donut-main">87%</p>
              <p className="donut-label">On-time / Đúng SLA</p>
            </div>
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
          <div className="cards-inline">
            <div className="card kpi-card small">
              <p className="kpi-label">On-time SLA</p>
              <p className="kpi-value">87%</p>
            </div>
            <div className="card kpi-card small">
              <p className="kpi-label">Overdue Tickets / Ticket trễ hạn</p>
              <p className="kpi-value">26</p>
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="section-title">
            Ticket Volume / Khối lượng ticket
          </h3>
          <div className="chart-placeholder line-chart">
            <div className="line-chart-grid" />
            <div className="line-chart-line" />
          </div>
          <div className="card table-card nested-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Category / Loại</th>
                  <th>Number of tickets / Số lượng ticket</th>
                  <th>Overdue count / Số ticket trễ</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{row.total}</td>
                    <td>{row.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Reports
