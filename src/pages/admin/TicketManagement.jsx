import { useEffect, useState } from 'react'
import { deleteTicket, fetchTickets, updateTicket } from '../../api/admin'

function TicketManagement() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchTickets()
      .then((data) => {
        if (!isMounted) return
        setTickets(data)
        setSelectedTicket(data[0] || null)
        setResponseText(data[0]?.adminResponse || '')
      })
      .catch((err) => setError(err.message || 'Không tải được tickets'))
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [])

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateTicket(selectedTicket.id, { status })
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setSelectedTicket(updated)
      setMessage('Đã cập nhật trạng thái')
    } catch (err) {
      setError(err.message || 'Cập nhật trạng thái thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (assignedTo) => {
    if (!selectedTicket) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateTicket(selectedTicket.id, { assignedTo })
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setSelectedTicket(updated)
      setMessage('Đã gán người xử lý')
    } catch (err) {
      setError(err.message || 'Gán thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleRespond = async () => {
    if (!selectedTicket) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateTicket(selectedTicket.id, {
        adminResponse: responseText,
      })
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setSelectedTicket(updated)
      setResponseText(updated.adminResponse || '')
      setMessage('Đã phản hồi cho ticket')
    } catch (err) {
      setError(err.message || 'Phản hồi thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa ticket này?')) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await deleteTicket(id)
      setTickets((prev) => prev.filter((t) => t.id !== id))
      if (selectedTicket?.id === id) setSelectedTicket(null)
      setMessage('Đã xóa ticket')
    } catch (err) {
      setError(err.message || 'Xóa ticket thất bại')
    } finally {
      setSaving(false)
    }
  }

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

      <section className="section">
        {error && <p className="text-danger">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </section>

      <section className="section section-with-panel">
        <div className="table-panel">
          <div className="section-header">
            <h3 className="section-title">Tickets</h3>
            {loading && <span className="badge subtle">Loading...</span>}
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
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={
                      selectedTicket?.id === ticket.id ? 'row-selected' : ''
                    }
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setResponseText(ticket.adminResponse || '')
                    }}
                  >
                    <td>{ticket.id}</td>
                    <td>{ticket.category}</td>
                    <td>{ticket.room}</td>
                    <td>{ticket.requestedBy}</td>
                    <td>{ticket.assignedTo}</td>
                    <td>
                      <span
                        className={`status-badge status-${ticket.statusKey || 'new'}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.slaDue}</td>
                    <td>
                      <button
                        type="button"
                        className="link-button small danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(ticket.id)
                        }}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!tickets.length && (
                  <tr>
                    <td colSpan="8">No tickets yet</td>
                  </tr>
                )}
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
                  <p className="detail-label">Description / Mô tả</p>
                  <p className="detail-value">{selectedTicket.description}</p>
                </div>
                {selectedTicket.adminResponse && (
                  <div>
                    <p className="detail-label">Admin response / Phản hồi</p>
                    <p className="detail-value">{selectedTicket.adminResponse}</p>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  Assign &amp; Actions / Phân công &amp; Thao tác
                </h4>
                <div className="form-field">
                  <label className="form-label">
                    Assign to / Gán cho
                  </label>
                  <input
                    className="input"
                    value={selectedTicket.assignedTo || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    placeholder="Nhập tên nhân sự"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleUpdateStatus('In Progress')}
                    disabled={saving}
                  >
                    Mark In Progress / Đang xử lý
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleUpdateStatus('Resolved')}
                    disabled={saving}
                  >
                    Resolve / Đã xử lý
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary subtle"
                    onClick={() => handleUpdateStatus('Reopened')}
                    disabled={saving}
                  >
                    Reopen / Mở lại
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary subtle"
                    onClick={() => handleUpdateStatus('Escalated')}
                    disabled={saving}
                  >
                    Escalate / Chuyển cấp trên
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">Respond / Phản hồi</h4>
                <div className="form-field">
                  <label className="form-label">Message / Nội dung</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Nội dung phản hồi cho người gửi"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRespond}
                    disabled={saving || !responseText.trim()}
                  >
                    Send Response / Gửi phản hồi
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
                      <p className="timeline-title">Ticket created / Tạo ticket</p>
                      <p className="timeline-meta">Ghi log mô phỏng</p>
                    </div>
                  </li>
                  <li className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">Assigned / Phân công</p>
                      <p className="timeline-meta">Mock timeline</p>
                    </div>
                  </li>
                  <li className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">Status update</p>
                      <p className="timeline-meta">Mock timeline</p>
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
