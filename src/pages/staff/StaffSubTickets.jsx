import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPriorityBadge(priority) {
  const configs = {
    low: { className: "status-new", label: "Low" },
    medium: { className: "status-in-progress", label: "Medium" },
    high: { className: "status-overdue", label: "High" },
    critical: { className: "status-overdue", label: "Critical" },
  };
  const config = configs[priority] || {
    className: "status-new",
    label: priority,
  };
  return (
    <span className={`status-badge ${config.className}`}>{config.label}</span>
  );
}

function getStatusBadge(status) {
  const configs = {
    assigned: { className: "status-in-progress", label: "Assigned" },
    in_progress: { className: "status-in-progress", label: "In Progress" },
    resolved: { className: "status-resolved", label: "Resolved" },
    denied: { className: "status-overdue", label: "Denied" },
    escalated: { className: "status-overdue", label: "Escalated" },
  };
  const config = configs[status] || { className: "status-new", label: status };
  return (
    <span className={`status-badge ${config.className}`}>{config.label}</span>
  );
}

function StaffSubTickets() {
  const navigate = useNavigate();
  const [subTickets, setSubTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [denyModal, setDenyModal] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  const loadSubTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(
        "/api/v1/sub-tickets/assigned-to-me"
      );
      const data = response?.data?.data || response?.data || response;
      // Convert object with numeric keys to array
      const subTicketsArray = Array.isArray(data) 
        ? data 
        : (data && typeof data === 'object' ? Object.values(data) : []);
      setSubTickets(subTicketsArray);
    } catch (err) {
      console.error("Failed to load sub-tickets:", err);
      setError(err?.message || "Failed to load sub-tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubTickets();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSubTickets();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (subTicketId) => {
    try {
      await apiClient.post(`/api/v1/sub-tickets/${subTicketId}/accept`);
      await loadSubTickets();
    } catch (err) {
      console.error("Failed to accept sub-ticket:", err);
      setAlertModal({
        message: "Failed to accept sub-ticket: " + (err?.message || "Unknown error")
      });
    }
  };

  const handleDeny = async (subTicketId, reason) => {
    try {
      await apiClient.post(`/api/v1/sub-tickets/${subTicketId}/deny`, {
        reason,
      });
      setDenyModal(null);
      await loadSubTickets();
    } catch (err) {
      console.error("Failed to deny sub-ticket:", err);
      setAlertModal({ message: "Failed to deny sub-ticket: " + (err?.message || "Unknown error") });
    }
  };

  const handleResolve = async (subTicketId, resolutionNote) => {
    try {
      await apiClient.patch(`/api/v1/sub-tickets/${subTicketId}/resolve`, {
        resolutionNote,
      });
      setResolveModal(null);
      await loadSubTickets();
    } catch (err) {
      console.error("Failed to resolve sub-ticket:", err);
      setAlertModal({
        message: "Failed to resolve sub-ticket: " + (err?.message || "Unknown error")
      });
    }
  };

  const handleReassignRequest = async (subTicketId, reason) => {
    try {
      await apiClient.post("/api/v1/reassign-requests", {
        subTicketId,
        reason,
      });
      setReassignModal(null);
      setAlertModal({ message: "Reassign request submitted successfully" });
    } catch (err) {
      console.error("Failed to submit reassign request:", err);
      setAlertModal({
        message: "Failed to submit reassign request: " + (err?.message || "Unknown error")
      });
    }
  };

  const canReassign = (status) => {
    return ["assigned", "in_progress", "escalated"].includes(status);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">My Sub-Tickets</h2>
          <p className="page-subtitle">Sub-tickets assigned to you</p>
        </div>
        
      </div>

      {loading && (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          Loading sub-tickets...
        </div>
      )}

      {!loading && error && (
        <div
          className="card"
          style={{
            padding: "1.5rem",
            borderLeft: "4px solid #dc2626",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && subTickets.length === 0 && (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#6b7280" }}>
            No sub-tickets assigned to you yet.
          </p>
        </div>
      )}

      {!loading && !error && subTickets.length > 0 && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Parent Ticket</th>
                  <th>Room</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned At</th>
                  <th>Accepted At</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subTickets.map((subTicket) => (
                  <tr key={subTicket.id}>
                    <td>{subTicket.parentTicket?.title || "N/A"}</td>
                    <td>{subTicket.parentTicket?.room?.name || "N/A"}</td>
                    <td>{subTicket.category?.name || "N/A"}</td>
                    <td>{getPriorityBadge(subTicket.priority)}</td>
                    <td>{getStatusBadge(subTicket.status)}</td>
                    <td>{formatDate(subTicket.assignedAt)}</td>
                    <td>{formatDate(subTicket.acceptedAt)}</td>
                    <td>{formatDate(subTicket.dueDate)}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "nowrap", // <- không cho wrap
                          whiteSpace: "nowrap", // <- tránh xuống dòng trong ô
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() =>
                            navigate(`/staff/sub-tickets/${subTicket.id}`)
                          }
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            color: '#2563eb',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(40px) saturate(200%)',
                            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)'
                          }}
                        >
                          Details
                        </button>

                        {subTicket.status === "assigned" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleAccept(subTicket.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)'
                              }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                setDenyModal({
                                  id: subTicket.id,
                                  category: subTicket.category?.name,
                                })
                              }
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                color: '#dc2626',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)'
                              }}
                            >
                              Deny
                            </button>
                          </>
                        )}

                        {subTicket.status === "in_progress" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                setResolveModal({
                                  id: subTicket.id,
                                  category: subTicket.category?.name,
                                })
                              }
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)'
                              }}
                            >
                              Resolve
                            </button>
                            {canReassign(subTicket.status) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-warning"
                                onClick={() =>
                                  setReassignModal({
                                    id: subTicket.id,
                                    category: subTicket.category?.name,
                                    subTicket: subTicket,
                                  })
                                }
                                style={{
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                  color: '#d97706',
                                  border: '1px solid rgba(245, 158, 11, 0.2)',
                                  borderRadius: '14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  backdropFilter: 'blur(40px) saturate(200%)',
                                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(245, 158, 11, 0.1)',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)'
                                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(245, 158, 11, 0.1)'
                                }}
                              >
                                Reassign
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <AlertModal
          message={alertModal.message}
          onClose={() => setAlertModal(null)}
        />
      )}

      {/* Deny Modal */}
      {denyModal && (
        <DenySubTicketModal
          category={denyModal.category}
          onClose={() => setDenyModal(null)}
          onSubmit={(reason) => handleDeny(denyModal.id, reason)}
        />
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <ResolveSubTicketModal
          category={resolveModal.category}
          onClose={() => setResolveModal(null)}
          onSubmit={(resolutionNote) =>
            handleResolve(resolveModal.id, resolutionNote)
          }
        />
      )}

      {/* Reassign Modal */}
      {reassignModal && (
        <ReassignRequestModal
          category={reassignModal.category}
          subTicket={reassignModal.subTicket}
          onClose={() => setReassignModal(null)}
          onSubmit={(reason) =>
            handleReassignRequest(reassignModal.id, reason)
          }
        />
      )}
    </div>
  );
}

// Deny Sub-Ticket Modal
function DenySubTicketModal({ category, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      return;
    }
    setSubmitting(true);
    await onSubmit(reason);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "1.5rem",
          margin: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 600 }}
        >
          Deny Sub-Ticket
        </h3>
        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
          <strong>Category:</strong> {category}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="reason"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Reason for denial <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              id="reason"
              rows={4}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you are denying this sub-ticket..."
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting}
            >
              {submitting ? "Denying..." : "Deny Sub-Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Resolve Sub-Ticket Modal
function ResolveSubTicketModal({ category, onClose, onSubmit }) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      return;
    }
    setSubmitting(true);
    await onSubmit(resolutionNote);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "1.5rem",
          margin: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 600 }}
        >
          Resolve Sub-Ticket
        </h3>
        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
          <strong>Category:</strong> {category}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="resolutionNote"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Resolution Notes <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              id="resolutionNote"
              rows={4}
              className="input"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe how you resolved this sub-ticket..."
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={submitting}
            >
              {submitting ? "Resolving..." : "Resolve Sub-Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reassign Request Modal
function ReassignRequestModal({ category, subTicket, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      return;
    }
    setSubmitting(true);
    await onSubmit(reason);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "1.5rem",
          margin: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 600 }}
        >
          Request Reassignment
        </h3>
        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
          <strong>Category:</strong> {category}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="reason"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Reason for reassignment{" "}
              <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              id="reason"
              rows={4}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need reassignment..."
              required
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginTop: "0.25rem",
              }}
            >
              Admin will review and assign a suitable staff member
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-warning"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Alert Modal Component
function AlertModal({ message, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "1.5rem",
          margin: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "1rem", fontSize: "1.125rem", fontWeight: 600, textAlign: "center" }}>
          Notice
        </div>
        <div style={{ marginBottom: "1.5rem", color: "#374151", textAlign: "center" }}>
          {message}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ minWidth: "100px" }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffSubTickets;
