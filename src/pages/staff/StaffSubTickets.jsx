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

  const loadSubTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(
        "/api/v1/sub-tickets/assigned-to-me"
      );
      const data = response?.data || response;
      setSubTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load sub-tickets:", err);
      setError(err?.message || "Failed to load sub-tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubTickets();
  }, []);

  const handleAccept = async (subTicketId) => {
    try {
      await apiClient.post(`/api/v1/sub-tickets/${subTicketId}/accept`);
      await loadSubTickets();
    } catch (err) {
      console.error("Failed to accept sub-ticket:", err);
      alert(
        "Failed to accept sub-ticket: " + (err?.message || "Unknown error")
      );
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
      alert("Failed to deny sub-ticket: " + (err?.message || "Unknown error"));
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
      alert(
        "Failed to resolve sub-ticket: " + (err?.message || "Unknown error")
      );
    }
  };

  const handleReassignRequest = async (subTicketId, reason, newAssignee) => {
    try {
      await apiClient.post("/api/v1/reassign-requests", {
        subTicketId,
        reason,
        newAssignee: newAssignee || undefined,
      });
      setReassignModal(null);
      alert("Reassign request submitted successfully");
    } catch (err) {
      console.error("Failed to submit reassign request:", err);
      alert(
        "Failed to submit reassign request: " +
          (err?.message || "Unknown error")
      );
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
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/staff/dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/staff/tickets")}
          >
            Assigned Tickets
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadSubTickets}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
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
                        >
                          Details
                        </button>

                        {subTicket.status === "assigned" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleAccept(subTicket.id)}
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
                            >
                              Deny
                            </button>
                          </>
                        )}

                        {/* các nút khác giữ nguyên */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
          onClose={() => setReassignModal(null)}
          onSubmit={(reason, newAssignee) =>
            handleReassignRequest(reassignModal.id, reason, newAssignee)
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
      alert("Please provide a reason for denying this sub-ticket.");
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
      alert("Please provide resolution notes.");
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
function ReassignRequestModal({ category, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Please provide a reason for reassignment.");
      return;
    }
    setSubmitting(true);
    await onSubmit(reason, newAssignee);
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
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="newAssignee"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Preferred New Assignee (Optional)
            </label>
            <input
              type="text"
              id="newAssignee"
              className="input"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              placeholder="Leave empty for admin to decide"
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginTop: "0.25rem",
              }}
            >
              Admin will review and assign appropriately
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

export default StaffSubTickets;
