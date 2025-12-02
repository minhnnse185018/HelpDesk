const categories = [
  {
    name: 'CSVC',
    description: 'Cơ sở vật chất / Facility infrastructure',
    defaultPriority: 'Medium',
    slaResponse: '4 hours',
    slaResolve: '2 days',
  },
  {
    name: 'WiFi',
    description: 'Mạng không dây / Wireless network',
    defaultPriority: 'High',
    slaResponse: '30 minutes',
    slaResolve: '4 hours',
  },
  {
    name: 'Thiết bị',
    description: 'Máy chiếu, máy tính, thiết bị lab',
    defaultPriority: 'High',
    slaResponse: '1 hour',
    slaResolve: '1 day',
  },
]

function CategoryManagement() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Feedback Categories / Loại phản ánh
          </h2>
          <p className="page-subtitle">
            Manage categories and SLA settings for tickets.
          </p>
        </div>
        <button type="button" className="btn btn-primary">
          New Category / Thêm loại mới
        </button>
      </div>

      <section className="section">
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Category Name / Tên loại</th>
                <th>Description / Mô tả</th>
                <th>Default Priority / Ưu tiên mặc định</th>
                <th>SLA Response Time / SLA phản hồi</th>
                <th>SLA Resolve Time / SLA xử lý</th>
                <th>Actions / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>{category.defaultPriority}</td>
                  <td>{category.slaResponse}</td>
                  <td>{category.slaResolve}</td>
                  <td>
                    <button type="button" className="link-button small">
                      Edit
                    </button>
                    <button type="button" className="link-button small danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default CategoryManagement
