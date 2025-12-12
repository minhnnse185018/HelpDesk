import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";

function AssignTicketModal({ ticket, onClose, onSubmit }) {
  const [staffId, setStaffId] = useState("");
  const [priority, setPriority] = useState(ticket.priority || "medium");
  const [staffList, setStaffList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const staffRes = await apiClient.get("/api/v1/users");

        let staffData = staffRes?.data || staffRes;

        // Convert to array if needed
        if (staffData && !Array.isArray(staffData)) {
          staffData = Object.values(staffData).filter(Boolean);
        }

        // Filter only staff role users
        const filteredStaff = (
          Array.isArray(staffData) ? staffData : []
        ).filter((user) => String(user.role || "").toLowerCase() === "staff");

        setStaffList(filteredStaff);
      } catch (err) {
        console.error("Failed to load staff:", err);
      }
    };

    loadData();
  }, [ticket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId) {
      return;
    }
    if (!priority) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(ticket.id, staffId, priority);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          width: "100%",
          maxWidth: "600px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Assign Ticket to Staff
          </h3>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.85rem",
              color: "#6b7280",
            }}
          >
            Ticket: <strong>{ticket.title}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Room:{" "}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {ticket.room?.name || "N/A"}
                </span>
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Current Priority:{" "}
                </span>
                <span style={{ color: "#6b7280", marginLeft: "0.25rem" }}>
                  {ticket.priority ? ticket.priority.toUpperCase() : "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Categories:{" "}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {Array.isArray(ticket.ticketCategories) &&
                  ticket.ticketCategories.length > 0
                    ? ticket.ticketCategories
                        .map((tc) => tc.category?.name)
                        .filter(Boolean)
                        .join(", ")
                    : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="staff"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Assign to Staff
                {staffList.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      fontWeight: 400,
                    }}
                  >
                    ({staffList.length} available)
                  </span>
                )}
              </label>
              <select
                id="staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                }}
              >
                <option value="">-- Select staff --</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName || staff.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                backgroundColor: "rgba(0, 0, 0, 0.03)",
                color: "#6b7280",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "14px",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
                backdropFilter: "blur(30px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#1d1d1f",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "14px",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
                backdropFilter: "blur(40px) saturate(200%)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {submitting ? "Assigning..." : "Assign Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignTicketModal;
