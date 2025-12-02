const rooms = [
  {
    building: 'A1',
    room: '203',
    department: 'CSVC',
    notes: 'Large lecture hall',
  },
  {
    building: 'Library',
    room: '2F-Reading',
    department: 'Library',
    notes: 'Quiet study area',
  },
]

const departments = [
  {
    name: 'IT',
    type: 'IT',
    email: 'it@university.edu',
    phone: '0123 456 789',
  },
  {
    name: 'CSVC',
    type: 'CSVC',
    email: 'csvc@university.edu',
    phone: '0987 654 321',
  },
  {
    name: 'KTX',
    type: 'KTX',
    email: 'ktx@university.edu',
    phone: '0909 000 111',
  },
]

function RoomsDepartments() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Rooms &amp; Departments / Phòng &amp; Bộ phận
          </h2>
          <p className="page-subtitle">
            Manage building rooms and responsible departments.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="tabs">
          <button type="button" className="tab tab-active">
            Rooms / Phòng
          </button>
          <button type="button" className="tab">
            Departments / Bộ phận
          </button>
        </div>

        <div className="card table-card">
          <div className="section-header">
            <h3 className="section-title">Rooms / Phòng</h3>
            <button type="button" className="btn btn-primary">
              Add new / Thêm mới
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Building / Tòa nhà</th>
                <th>Room / Phòng</th>
                <th>Department in charge / Bộ phận phụ trách</th>
                <th>Notes / Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={`${room.building}-${room.room}`}>
                  <td>{room.building}</td>
                  <td>{room.room}</td>
                  <td>{room.department}</td>
                  <td>{room.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card table-card spaced-top">
          <div className="section-header">
            <h3 className="section-title">Departments / Bộ phận</h3>
            <button type="button" className="btn btn-primary">
              Add new / Thêm mới
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Department Name / Tên bộ phận</th>
                <th>Type / Loại</th>
                <th>Contact email / Email liên hệ</th>
                <th>Phone / Số điện thoại</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.name}>
                  <td>{department.name}</td>
                  <td>{department.type}</td>
                  <td>{department.email}</td>
                  <td>{department.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default RoomsDepartments
